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
            if (line.match(/item\s*\[\d+]/)) {
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
