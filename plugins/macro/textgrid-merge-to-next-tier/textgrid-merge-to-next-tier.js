let repeater = params["repeater"];
let targetTier = params["targetTier"];
let forceUpdate = params["forceUpdate"];
let updateAllSamples = params["updateAllSamples"];
let recursiveTierUpdateHierarchy = params["recursiveTierUpdateHierarchy"];
let currentModule = modules[currentModuleIndex];
let [currentWav, currentIndex, currentTier] = parseModuleName(currentModule.name);
let reportTexts = [];

if (!targetTier && !recursiveTierUpdateHierarchy) {
    error("Please input `Target tier` or `Recursive tier update hierarchy`.");
}

main();

function parseModuleName(moduleName) {
    let wav = moduleName.split(".wav_")[0] + ".wav";
    let index = moduleName.split(".wav_")[1].split("_")[0];
    let tier = moduleName.split(".wav_")[1].split("_").slice(1).join("_");
    return [wav, index, tier];
}

function getModuleName(wav, index, tier) {
    return wav + "_" + index + "_" + tier;
}

function findModule(modules, wavName, tierName, targetIndex = null) {
    for (let module of modules) {
        let [wav, index, tier] = parseModuleName(module.name);
        if (
            (wav === wavName || !wavName) &&
            (tier === tierName || !tierName) &&
            (index === targetIndex || !targetIndex)
        ) {
            return module;
        }
    }
    return null;
}

function main() {
    if (recursiveTierUpdateHierarchy) {
        let tierNames = recursiveTierUpdateHierarchy.split(">");
        if (tierNames.length < 2) {
            error("`Recursive tier update hierarchy` must have at least two tiers.");
        }
        for (let i = 0; i < tierNames.length - 1; i++) {
            mergeTier(tierNames[i], tierNames[i + 1]);
        }
    } else {
        if (currentTier === targetTier) {
            report("Failure: Current tier is already the target tier. Please input another tier name.");
            return;
        }
        mergeTier(currentTier, targetTier);
    }

    if (reportTexts.length > 0) {
        report(reportTexts.join("\n------------------------------------------\n"));
    }
}

function mergeTier(sourceTierName, targetTierName) {
    console.log(`Merging tier ${sourceTierName} to ${targetTierName}.`);
    let wavNames = [];
    if (updateAllSamples) {
        modules.forEach((module) => {
            let wav = parseModuleName(module.name)[0];
            if (!wavNames.includes(wav)) {
                wavNames.push(wav);
            }
        });
    } else {
        wavNames.push(currentWav);
    }
    wavNames.forEach((wavName) => {
        let sourceModuleName = findModule(modules, wavName, sourceTierName).name;
        if (!sourceModuleName) {
            error(`Could not find source tier "${sourceTierName}" for wav "${wavName}".`);
        }
        let targetModule = findModule(modules, wavName, targetTierName);
        let targetModuleName = null;
        let createModule = false;
        if (targetModule) {
            targetModuleName = targetModule.name;
        } else {
            if (recursiveTierUpdateHierarchy) {
                // in this case we only handle existing modules
                error("`Recursive tier update hierarchy` is not supported for creating new modules.");
            } else {
                let sourceModuleIndex = parseModuleName(sourceModuleName)[1];
                let targetModuleIndex = sourceModuleIndex + 1;
                createModule = true;
                targetModuleName = getModuleName(wavName, targetModuleIndex, targetTierName);
            }
        }
        mergeModule(sourceModuleName, targetModuleName, createModule);
    });
}

function mergeModule(sourceModuleName, targetModuleName, createModule) {
    console.log(`Merging module ${sourceModuleName} to ${targetModuleName}, createModule=${createModule}.`);
    let sourceModule = modules.find((module) => module.name === sourceModuleName);
    let targetModule = modules.find((module) => module.name === targetModuleName);
    if (!targetModule && !createModule) {
        error("Could not find target module " + targetModuleName + ".");
    }
    let sourceEntries = sourceModule.entries;
    let entryIndexesMissingTags = sourceEntries
        .map((entry, index) => [entry, index])
        .filter(([entry, index]) => !Boolean(entry.notes) || !Boolean(entry.notes.tag))
        .map(([entry, index]) => index);

    if (entryIndexesMissingTags.length > 0) {
        let reportText = `Failure: Module ${sourceModuleName} has entries without tags. Please tag all entries.`;
        for (let index of entryIndexesMissingTags) {
            reportText += `\nEntry ${index + 1}: ${sourceEntries[index].name}`;
        }
        reportTexts.push(reportText);
        return;
    }

    if (!targetModule) {
        let mergedEntries = mergeEntries(sourceEntries);
        let newModule = Object.assign({}, sourceModule);
        newModule.name = targetModuleName;
        newModule.entries = mergedEntries;
        newModule.entryFilter = null;
        newModule.currentIndex = 0;

        let [newWav, newIndex, newTier] = parseModuleName(targetModuleName);
        let previousModule = findModule(modules, newWav, null, newIndex - 1);
        let moduleIndexOfPreviousModule = modules.indexOf(previousModule);
        modules.splice(moduleIndexOfPreviousModule + 1, 0, newModule);

        return;
    }

    let targetEntries = targetModule.entries;
    let targetEntryNameList = targetEntries.map((entry) => entry.name);
    let mergedEntries = mergeEntries(sourceEntries);
    let mergedEntryNameList = mergedEntries.map((entry) => entry.name);

    if (!forceUpdate && JSON.stringify(targetEntryNameList) !== JSON.stringify(mergedEntryNameList)) {
        let text = "Failure: The merged entries don't match the existing target tier. Please check the entries.";
        text +=
            "\nYou can turn on the `Force update` option to overwrite the existing target tier without getting this error.";
        text += "\nBut please note that all other info including tags will be lost on the conflicting entries.";
        text += "\n\nFrom: " + sourceModuleName;
        text += "\nExisting entries:" + "\n" + targetEntryNameList.join(", ");
        text += "\n\nTo: " + targetModuleName;
        text += "\nMerged entries:" + "\n" + mergedEntryNameList.join(", ");
        reportTexts.push(text);
        return;
    }

    let newEntries = [];
    for (let i = 0; i < mergedEntryNameList.length; i++) {
        if (targetEntryNameList[i] !== mergedEntryNameList[i]) {
            newEntries.push(mergedEntries[i]);
            continue;
        }

        let newEntry = Object.assign({}, mergedEntries[i]);
        newEntry.notes = targetEntries[i].notes;
        newEntries.push(newEntry);
    }
    targetModule.entries = newEntries;
    if (targetModule.currentIndex >= targetModule.entries.length) {
        targetModule.currentIndex = 0;
    }
}

function mergeEntries(entries) {
    let result = [];
    let currentStart = 0;
    let currentEnd = 0;
    let currentTag = null;

    function pushCurrent(entry) {
        let mergedEntry = Object.assign({}, entry);
        mergedEntry.start = currentStart;
        mergedEntry.end = currentEnd;
        mergedEntry.name = currentTag.replace(new RegExp(`${repeater}+$`), "");
        mergedEntry.notes = new Notes();
        result.push(mergedEntry);
    }

    for (let entry of entries) {
        let tag = entry.notes.tag;
        if (tag !== currentTag) {
            if (currentTag !== null) {
                pushCurrent(entry);
            }
            currentStart = entry.start;
            currentTag = tag;
        }
        currentEnd = entry.end;
    }

    if (currentTag !== null) {
        pushCurrent(entries[entries.length - 1]);
    }

    return result;
}
