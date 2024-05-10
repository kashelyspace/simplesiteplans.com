(function(wpm, $, undefined) {

    const PMW_LIBRARY_VERSION = "1.42.1"

    wpm.getLibraryVersion = () => {
        return PMW_LIBRARY_VERSION
    }

    wpm.checkLibraryVersion = () => {

        if (wpm.getLibraryVersion() !== wpmDataLayer ? .version ? .number) {
            console.error(`Pixel Manager: The library version ${wpm.getLibraryVersion()} and wpmDataLayer.version.number ${wpmDataLayer.version.number} do not match. Delete the server-side cache and try again.`)
        }
    }

}(window.wpm = window.wpm || {}, jQuery))