let newName = params["newName"]
let process = params["process"]

function parseModuleName(moduleName) {
    function errorFormat() {
        error("The input name is not valid. Please check the required format.")
    }

    if (!moduleName.includes(".wav_")) {
        errorFormat()
    }
    let wav = moduleName.split('.wav_')[0] + ".wav"

    if (!moduleName.split('.wav_')[1].includes("_")) {
        errorFormat()
    }

    let index = moduleName.split('.wav_')[1].split('_')[0]
    if (!Number.isInteger(Number(index))) {
        errorFormat()
    }
    let tier = moduleName.split('.wav_')[1].split('_').slice(1).join('_')
    return [wav, index, tier]
}

if (process !== "remove") {
    let [newWav, newIndex, newTier] = parseModuleName(newName)
    if (debug) {
        console.log(`newWav: ${newWav}`)
        console.log(`newIndex: ${newIndex}`)
        console.log(`newTier: ${newTier}`)
    }

    for (let moduleIndex in modules) {
        if (Number(moduleIndex) === currentModuleIndex && process === "rename") {
            continue
        }
        let module = modules[moduleIndex]
        let [wav, index, tier] = parseModuleName(module.name)
        if (debug) {
            console.log(`wav: ${wav}`)
            console.log(`index: ${index}`)
            console.log(`tier: ${tier}`)
        }
        if (wav === newWav) {
            if (tier === newTier) {
                error(`The tier '${tier}' in the new name already exists.`)
            }
        }
    }
}

switch (process) {
    case "rename":
        modules[currentModuleIndex].name = newName
        break
    case "duplicate":
        let duplicated = JSON.parse(JSON.stringify(modules[currentModuleIndex]))
        duplicated.name = newName
        modules.push(duplicated)
        break;
    case "add":
        let added = JSON.parse(JSON.stringify(modules[currentModuleIndex]));
        added.name = newName
        added.currentIndex = 0
        let firstEntry = added.entries[0]
        let newEntry = new Entry(firstEntry.sample, labelerParams["nameForEmpty"], 0, 0, [], [])
        added.entries = [newEntry]
        added.entryFilter = null
        modules.push(added)
        break
    case "remove":
        modules.splice(currentModuleIndex, 1)
        currentModuleIndex -= 1
        break
    default:
        error(`Unknown process: ${process}`)
        break;
}

modules.sort((a, b) => {
    return a.name.localeCompare(b.name)
})
