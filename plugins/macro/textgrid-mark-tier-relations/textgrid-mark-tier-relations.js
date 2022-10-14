let repeater = params["repeater"]
let tiersText = params["tiers"]
let tolerance = parseFloat(params["tolerance"])
if (tolerance < 0) {
    error("Tolerance must be non-negative.")
}

let tiers = tiersText.split(">").map(tier => tier.trim())
let tierMergeMap = {}
for (let i = 0; i < tiers.length - 1; i++) {
    tierMergeMap[tiers[i]] = tiers[i + 1]
}

function getTierName(moduleName) {
    return moduleName.split('.wav_')[1].split('_').slice(1).join('_')
}

function alignBoundaries(parents, children) {
    let childBoundaryIndexesAligned = []
    let childIndex = 0
    for (let parent of parents) {
        let foundChildIndex = null
        while (childIndex < children.length && children[childIndex] <= tolerance + parent) {
            if (children[childIndex] >= parent - tolerance) {
                foundChildIndex = childIndex
            }
            childIndex++
        }
        if (foundChildIndex === null) {
            error("Could not find child boundary for parent boundary " + parent)
        } else {
            childBoundaryIndexesAligned.push(foundChildIndex)
        }
    }
    return childBoundaryIndexesAligned
}

for (let module of modules) {
    let tierName = getTierName(module.name)
    let tierNameNext = tierMergeMap[tierName]
    if (!tierNameNext) {
        continue
    }
    if (debug) {
        console.log(`Marking tier "${tierName}" from module "${module.name}" with parent tier "${tierNameNext}"`)
    }
    let nextModule = modules.find(module => getTierName(module.name) === tierNameNext)

    let parentEntries = nextModule.entries
    let childEntries = module.entries
    let parentBoundaries = [parentEntries[0].start]
    for (let parentEntry of parentEntries) {
        parentBoundaries.push(parentEntry.end)
    }
    let childBoundaries = [childEntries[0].start]
    for (let childEntry of childEntries) {
        childBoundaries.push(childEntry.end)
    }
    if (debug) {
        console.log(`Parent boundaries: ${parentBoundaries}`)
        console.log(`Child boundaries: ${childBoundaries}`)
    }
    let childBoundaryIndexesAligned = alignBoundaries(parentBoundaries, childBoundaries)
    if (debug) {
        console.log(`Child boundary indexes aligned: ${childBoundaryIndexesAligned}`)
    }

    let lastParentEntryName = null
    let repeatCount = 0
    for (let parentEntryPos = 0; parentEntryPos < parentEntries.length; parentEntryPos++) {
        let parentEntry = parentEntries[parentEntryPos]
        let parentEntryName = parentEntry.name
        if (parentEntryName === lastParentEntryName) {
            repeatCount++
        } else {
            repeatCount = 0
        }
        lastParentEntryName= parentEntryName
        for (let i = 0; i < repeatCount; i++) {
            parentEntryName += repeater
        }
        let firstChildEntryIndex = childBoundaryIndexesAligned[parentEntryPos]
        let lastChildEntryIndex = childBoundaryIndexesAligned[parentEntryPos + 1] - 1
        console.log(`firstChildEntryIndex: ${firstChildEntryIndex}, lastChildEntryIndex: ${lastChildEntryIndex}`)
        for (let childEntryIndex = firstChildEntryIndex; childEntryIndex <= lastChildEntryIndex; childEntryIndex++) {
            let childEntry = childEntries[childEntryIndex]
            childEntry.notes.tag = parentEntryName
        }
    }
}
