function constructProject(params, root) {
    let wavFolderName = params['wavFolderName']
    let textgridFolderName = params['textgridFolderName']
    let wavFolder = root.resolve(wavFolderName);
    let textgridFolder = root.resolve(textgridFolderName)
    let modules = []
    let wavFiles = wavFolder.listChildFiles().filter(f => f.getExtension() === 'wav')
    wavFiles.forEach(wavFile => {
        let wavName = wavFile.getNameWithoutExtension()
        let textgridFile = textgridFolder.resolve(wavName + '.TextGrid')
        let modulesInThisWav = []
        if (textgridFile.exists()) {
            let lines = textgridFile.readLines().map(l => l.trim())
            let i = 0
            let tiers = []
            while (i < lines.length) {
                let line = lines[i]
                if (line.match(/item\s*\[\d]/)) {
                    let index = tiers.length + 1
                    i++
                    let type = lines[i].split('=')[1].trim().replace(/^"+|"+$/g, '')
                    i++
                    let name = lines[i].split('=')[1].trim().replace(/^"+|"+$/g, '')
                    tiers.push({index, type, name})
                }
                i++
            }
            for (let tier of tiers) {
                if (tier.type !== 'IntervalTier') {
                    continue
                }
                let moduleName = wavFile.getName() + `_` + tier.index + '_' + tier.name
                let module = new ModuleDefinition(
                    moduleName,
                    wavFolder.getAbsolutePath(),
                    [wavFile.getName()],
                    [textgridFile.getAbsolutePath()],
                    textgridFile.getAbsolutePath(),
                )
                modulesInThisWav.push(module)
            }
        }
        if (modulesInThisWav.length === 0) {
            let moduleName = wavFile.getName() + '_1_default'
            let module = new ModuleDefinition(
                moduleName,
                wavFolder.getAbsolutePath(),
                [wavFile.getName()],
                [textgridFile.getAbsolutePath()],
                textgridFile.getAbsolutePath(),
            )
            modulesInThisWav.push(module)
        }
        modules.push(...modulesInThisWav)
    })
    return modules
}

function parse(sampleFileNames, inputs, params) {
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
        if (line.match(/item\s*\[\d]/)) {
            if (entriesInCurrentModule.length > 0) {
                modules.push(entriesInCurrentModule)
                entriesInCurrentModule = []
            }
        } else if (line.match(/intervals\s*\[\d]/)) {
            console.log(`intervals found: ${line}`)
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
    return modules
}

function write(moduleNames, modules) {
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
}
