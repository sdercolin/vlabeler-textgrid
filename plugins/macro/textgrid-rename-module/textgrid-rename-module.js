let newName = params["newName"]

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

let [newWav, newIndex, newTier] = parseModuleName(newName)
if (debug) {
    console.log(`newWav: ${newWav}`)
    console.log(`newIndex: ${newIndex}`)
    console.log(`newTier: ${newTier}`)
}

for (let moduleIndex in modules) {
    if (Number(moduleIndex) === currentModuleIndex) {
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

modules[currentModuleIndex].name = newName

modules.sort((a, b) => {
    return a.name.localeCompare(b.name)
})
