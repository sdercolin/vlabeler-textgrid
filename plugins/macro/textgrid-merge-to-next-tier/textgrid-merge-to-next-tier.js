function main() {
    let repeater = params["repeater"]
    let targetTierName = params["targetTier"]
    let forceUpdate = params["forceUpdate"]

    function parseModuleName(moduleName) {
        let wav = moduleName.split('.wav_')[0] + ".wav"
        let index = moduleName.split('.wav_')[1].split('_')[0]
        let tier = moduleName.split('.wav_')[1].split('_').slice(1).join('_')
        return [wav, index, tier]
    }

    function mergeEntries(entries) {
        let result = []
        let currentStart = 0
        let currentEnd = 0
        let currentTag = null

        function pushCurrent(entry) {
            let mergedEntry = Object.assign({}, entry)
            mergedEntry.start = currentStart
            mergedEntry.end = currentEnd
            mergedEntry.name = currentTag.replace(new RegExp(`${repeater}+$`), '')
            mergedEntry.notes = new Notes()
            result.push(mergedEntry)
        }

        for (let entry of entries) {
            let tag = entry.notes.tag
            if (tag !== currentTag) {
                if (currentTag !== null) {
                    pushCurrent(entry)
                }
                currentStart = entry.start
                currentTag = tag
            }
            currentEnd = entry.end
        }

        if (currentTag !== null) {
            pushCurrent(entries[entries.length - 1])
        }

        return result
    }

    let targetModule = null
    let currentModule = modules[currentModuleIndex]
    let [currentWav, currentIndex, currentTier] = parseModuleName(currentModule.name)

    if (currentTier === targetTierName) {
        report("Failure: Current tier is already the target tier. Please input another tier name.")
        return
    }

    let currentEntries = modules[currentModuleIndex].entries
    let entryIndexesMissingTags = currentEntries.map((entry, index) => [entry, index])
            .filter(([entry, index]) => (!Boolean(entry.notes) || !Boolean(entry.notes.tag)))
            .map(([entry, index]) => index)

    if (entryIndexesMissingTags.length > 0) {
        let reportText = "Failure: Current tier has entries without tags. Please tag all entries."
        for (let index of entryIndexesMissingTags) {
            reportText += `\nEntry ${index + 1}: ${currentEntries[index].name}`
        }
        report(reportText)
        return
    }

    for (let module of modules) {
        let [wav, index, tier] = parseModuleName(module.name)
        if (tier === targetTierName && wav === currentWav) {
            targetModule = module
            break
        }
    }

    if (!targetModule) {
        let count = modules.filter(module => parseModuleName(module.name)[0] === currentWav).length
        let newModuleName = currentWav + "_" + (count + 1) + "_" + targetTierName
        let mergedEntries = mergeEntries(modules[currentModuleIndex].entries)
        let newModule = Object.assign({}, currentModule)
        newModule.name = newModuleName
        newModule.entries = mergedEntries
        newModule.entryFilter = null
        newModule.currentIndex = 0

        let lastIndexOfThisWav = 0
        for (let i = 0; i < modules.length; i++) {
            let [wav, index, tier] = parseModuleName(modules[i].name)
            if (wav === currentWav) {
                lastIndexOfThisWav = i
            }
        }

        modules.splice(lastIndexOfThisWav + 1, 0, newModule)
        currentModuleIndex = lastIndexOfThisWav + 1
        return
    }

    let targetEntries = targetModule.entries
    let targetEntryNameList = targetEntries.map(entry => entry.name)
    let mergedEntries = mergeEntries(currentModule.entries)
    let mergedEntryNameList = mergedEntries.map(entry => entry.name)

    if (debug) {
        console.log("targetEntryNameList", targetEntryNameList)
        console.log("mergedEntryNameList", mergedEntryNameList)
    }

    if (!forceUpdate && JSON.stringify(targetEntryNameList) !== JSON.stringify(mergedEntryNameList)) {
        let text = "Failure: The merged entries don't match the existing target tier. Please check the entries."
        text += "\nYou can turn on the `Force update` option to overwrite the existing target tier without getting this error."
        text += "\nBut please note that all other info including tags will be lost on the conflicting entries."
        text += "\n\nTarget tier entries:" + "\n" + targetEntryNameList.join(", ")
        text += "\n\nMerged entries:" + "\n" + mergedEntryNameList.join(", ")
        report(text)
        return
    }

    let newEntries = []
    for (let i = 0; i < mergedEntryNameList.length; i++) {

        if (targetEntryNameList[i] !== mergedEntryNameList[i]) {
            newEntries.push(mergedEntries[i])
            continue
        }

        let newEntry = Object.assign({}, mergedEntries[i])
        newEntry.notes = targetEntries[i].notes
        newEntries.push(newEntry)
    }
    if (debug) {
        console.log("newEntries", JSON.stringify(newEntries))
    }
    targetModule.entries = newEntries
    currentModuleIndex = modules.indexOf(targetModule)
}

main()
