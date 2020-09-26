
# To build an unlisted extension, get an API key from https://addons.mozilla.org/en-US/developers/addon/api/key/
JWT_ISSUER=
JWT_SECRET=

# Set these to run in an existing Firefox profile
FIREFOX=nightly
FIREFOX_PROFILE=default-nightly

.PHONY: all
all: nofeed.zip nofeed.xpi

.PHONY: dev
dev:
	web-ext run --firefox=${FIREFOX} --firefox-profile=${FIREFOX_PROFILE}

nofeed.zip: img src manifest.json
	web-ext build
nofeed.xpi: img src manifest.json
	web-ext sign --channel=unlisted --api-key=${JWT_ISSUER} --api-secret=${JWT_SECRET}
