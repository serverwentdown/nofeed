console.log("hello, world!")

const cleanup_map = {
	"twitter.com": {
		clean: async function () {
			const sidebar = document.querySelector("[role=banner] [role=navigation]");
			if (!sidebar) {
				return null;
			}

			sidebar.childNodes.forEach(item => {
				if (item.href && item.href.endsWith("/home")) {
					sidebar.removeChild(item);
				}
			});

			const heading = document.querySelector("[role=banner] [role=heading]");
			if (!heading) {
				return null;
			}
			heading.querySelector('[href="/home"]').style.pointerEvents = "none";
		},
	},
};

const page_map = {
	"https://twitter.com/home": {
		name: "twitter",
		default: "lists",
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
	const cleanup_configuration = cleanup_map[current_host];

	// Run cleanup scripts
	await cleanup_configuration.clean();

	const current_url = window.location.href;
	const page_configuration = page_map[current_url];
	if (!page_configuration) {
		console.debug(`skipping ${current_url}`);
		return;
	}

	// Obtain user configuration
	let mode = await get_config_one(page_configuration.name);
	if (!mode) {
		mode = page_configuration.default;
		console.debug(`mode not set. using default mode ${mode}`);
	}
	const mode_options = await get_config_one(page_configuration.name + "-" + mode + "-options");
	console.debug(`mode ${mode} options ${mode_options}`);

	if (mode === "disabled") {
		return;
	}

	// Run the chosen mode
	const url = await page_configuration[mode](mode_options);
	console.debug(`new url ${url}`);
	if (!url) {
		return;
	}
	window.location.href = url;
}

window.addEventListener("load", () => {
	main().then(done => {
		// Success!
	}, err => {
		console.error(err);
	});
});
