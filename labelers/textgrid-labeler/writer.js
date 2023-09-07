let nameForEmpty = params['nameForEmpty']
if (!nameForEmpty || nameForEmpty === '') {
    nameForEmpty = '(empty)'
}
let lines = []
lines.push(`File type = "ooTextFile"`)
lines.push(`Object class = "TextGrid"`)
lines.push(``)
lines.push(`xmin = 0`)
let totalEnd = 0
for (module of modules) {
    if (module.length > 0) {
        let moduleEnd = module[module.length - 1].end
        if (moduleEnd > totalEnd) {
            totalEnd = moduleEnd
        }
    }
}
lines.push(`xmax = ${totalEnd / 1000}`)
lines.push(`tiers? <exists>`)
lines.push(`size = ${modules.length}`)
lines.push(`item []:`)

for (moduleIndex in moduleNames) {
    let moduleName = moduleNames[moduleIndex]
    let tierIndex = parseInt(moduleName.split('.wav_')[1].split('_')[0])
    let tierName = moduleName.split('.wav_')[1].split('_').slice(1).join('_')
    let entries = modules[moduleIndex]
    let moduleEnd = 0
    if (entries.length > 0) {
        moduleEnd = entries[entries.length - 1].end
    }
    lines.push(`    item [${tierIndex}]:`)
    lines.push(`        class = "IntervalTier"`)
    lines.push(`        name = "${tierName}"`)
    lines.push(`        xmin = 0`)
    lines.push(`        xmax = ${moduleEnd / 1000}`)
    lines.push(`        intervals: size = ${entries.length}`)
    for (let i in entries) {
        let entry = entries[i]
        let number = parseInt(i) + 1
        let entryName = entry.name
        if (entryName === nameForEmpty) {
            entryName = ''
        }
        lines.push(`        intervals [${number}]:`)
        lines.push(`            xmin = ${entry.start / 1000}`)
        lines.push(`            xmax = ${entry.end / 1000}`)
        lines.push(`            text = "${entryName}"`)
    }
}
output = lines.join('\n')
