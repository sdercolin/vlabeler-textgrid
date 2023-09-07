let nameForEmpty = params['nameForEmpty']
if (!nameForEmpty || nameForEmpty === '') {
    nameForEmpty = '(empty)'
}
let sampleName = sampleFileNames[0]
let lines = inputs[0]
let i = 0
let modules = []
let entriesInCurrentModule = []
while (i < lines.length) {
    let line = lines[i]
    if (line.match(/item\s*\[\d+]/)) {
        if (entriesInCurrentModule.length > 0) {
            modules.push(entriesInCurrentModule)
            entriesInCurrentModule = []
        }
    } else if (line.match(/intervals\s*\[\d+]/)) {
        i++
        let xmin = lines[i].split('=')[1].trim()
        let start = parseFloat(xmin) * 1000
        i++
        let xmax = lines[i].split('=')[1].trim()
        let end = parseFloat(xmax) * 1000
        i++
        let name = lines[i].split('=')[1].trim().replace(/^"+|"+$/g, '')
        if (name === '') {
            name = nameForEmpty
        }
        let entry = new Entry(
            sampleName,
            name,
            start,
            end,
            [],
            [],
        )
        entriesInCurrentModule.push(entry)
    }
    i++
}
if (entriesInCurrentModule.length > 0) {
    modules.push(entriesInCurrentModule)
}
