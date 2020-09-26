console.log("hello, world!")

const sites = {
	"youtube": {
		_hosts: ["www.youtube.com"],
		_bad_urls: ["https://www.youtube.com/"],
		_default: "subscriptions",
		subscriptions: async function () {
			return "/feed/subscriptions";
		},
		_clean: async function () {
			const sidebar_mini = document.querySelector('ytd-mini-guide-renderer > div');
			if (sidebar_mini) {
				sidebar_mini.childNodes.forEach(item => {
					const link = item.querySelector("a");
					if (link && link.href && link.href.endsWith("youtube.com/")) {
						sidebar_mini.removeChild(item);
					}
				});
			}

			const sidebar = document.querySelector('ytd-guide-section-renderer > div');
			if (sidebar) {
				sidebar.childNodes.forEach(item => {
					const link = item.querySelector("a");
					if (link && link.href && link.href.endsWith("youtube.com/")) {
						sidebar.removeChild(item);
					}
				});
			}

			const logos = document.querySelectorAll('ytd-topbar-logo-renderer a');
			logos.forEach(item => {
				item.style.pointerEvents = "none";
			});

			const home = document.querySelector('[page-subtype=home]');
			if (home) {
				home.style.display = "none";
			}
		},
	},
	"twitter": {
		_hosts: ["twitter.com"],
		_bad_urls: ["https://twitter.com/home"],
		_default: "lists",
		lists: async function () {
			const sidebar = document.querySelector("[role=navigation]");
			if (!sidebar) {
				return null;
			}

			let url = null;
			sidebar.childNodes.forEach(item => {
				if (item.href && item.href.endsWith("/lists")) {
					url = item.href;
				}
			});
			return url;
		},
		_clean: async function () {
			const sidebar = document.querySelector("[role=banner] [role=navigation]");
			if (sidebar) {
				sidebar.childNodes.forEach(item => {
					if (item.href && item.href.endsWith("/home")) {
						sidebar.removeChild(item);
					}
				});
			}

			const heading = document.querySelector("[role=banner] [role=heading]");
			if (heading) {
				const logo = heading.querySelector('[href="/home"]');
				if (logo) {
					logo.style.pointerEvents = "none";
				}
			}

			if (window.location.href.endsWith("/home")) {
				const timeline = document.querySelector('main [role=region]');
				if (timeline) {
					timeline.style.display = "none";
				}
			}
		},
	},
};

// Configuration

async function get_config_one(key) {
	return await browser.storage.sync.get(key)[key];
}

// DOM

let dom_content_loaded = false;
async function wait_dom_content_loaded() {
	if (dom_content_loaded) {
		return;
	}
	return new Promise(resolve => {
		window.addEventListener("DOMContentLoaded", () => {
			resolve();
		});
	});
}

// Main

async function main() {
	const current_host = window.location.host;

	let site_name = null;
	for (let k in sites) {
		if (sites[k]._hosts.indexOf(current_host) >= 0) {
			site_name = k;
		}
	}
	let site = sites[site_name];

	if (!site) {
		console.debug(`site ${current_host} not found`);
		return;
	}

	// Obtain user configuration
	let mode = await get_config_one(site_name + "-mode");
	if (!mode) {
		mode = site._default;
		console.debug(`mode not set. using default mode ${mode}`);
	}
	const mode_options = await get_config_one(site_name + "-mode-" + mode + "-options");
	console.debug(`mode ${mode} options ${mode_options}`);

	if (mode === "disabled") {
		return;
	}

	// Run cleanup scripts
	await site._clean();
	setInterval(async () => {
		await site._clean();
	}, 1000);


	const current_url = window.location.href;
	if (site._bad_urls.indexOf(current_url) < 0) {
		console.debug(`url is not bad`);
		return;
	}

	// Run the chosen mode
	if (!site[mode]) {
		return;
	}
	const url = await site[mode](mode_options);
	console.debug(`new url ${url}`);
	if (!url) {
		return;
	}
	window.location.href = url;
}

main().then(done => {
	// Success!
}, err => {
	console.error(err);
});
