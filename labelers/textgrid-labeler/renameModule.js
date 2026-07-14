function parseModuleName(moduleName) {
    function errorFormat() {
        error({
            en: `The name "${moduleName}" is not valid. ` +
                    'Please keep the format of the module name: <wav_file_name>_<tier_index>_<tier_name>, ' +
                    'e.g. "foo.wav_1_phoneme".',
            zh: `名称 "${moduleName}" 无效。请保持模块名称的格式：<wav_file_name>_<tier_index>_<tier_name>，` +
                    '例如 "foo.wav_1_phoneme"。',
            ja: `名前「${moduleName}」は無効です。モジュール名の形式を保ってください：` +
                    '<wav_file_name>_<tier_index>_<tier_name>（例：「foo.wav_1_phoneme」）。'
        })
    }

    if (!moduleName.includes('.wav_')) {
        errorFormat()
    }
    let wav = moduleName.split('.wav_')[0] + '.wav'
    let rest = moduleName.split('.wav_')[1]
    if (!rest.includes('_')) {
        errorFormat()
    }
    let index = rest.split('_')[0]
    if (!Number.isInteger(Number(index))) {
        errorFormat()
    }
    let tier = rest.split('_').slice(1).join('_')
    return [wav, Number(index), tier]
}

function checkNewModuleName(newName, excludedModuleIndex) {
    parseModuleName(newName)
    let newWav = newName.split('.wav_')[0] + '.wav'
    let newTier = newName.split('.wav_')[1].split('_').slice(1).join('_')
    modules.forEach((module, index) => {
        if (index === excludedModuleIndex) {
            return
        }
        if (module.name === newName) {
            error({
                en: `The module name "${newName}" already exists.`,
                zh: `模块名称 "${newName}" 已存在。`,
                ja: `モジュール名「${newName}」は既に存在しています。`
            })
        }
        let [wav, tierIndex, tier] = parseModuleName(module.name)
        if (wav === newWav && tier === newTier) {
            error({
                en: `The tier "${newTier}" already exists in "${newWav}".`,
                zh: `层 "${newTier}" 已存在于 "${newWav}" 中。`,
                ja: `ティア「${newTier}」は「${newWav}」に既に存在しています。`
            })
        }
    })
}

let newName = params['newName']
checkNewModuleName(newName, currentModuleIndex)
let currentWav = modules[currentModuleIndex].name.split('.wav_')[0] + '.wav'
let enteredWav = newName.split('.wav_')[0] + '.wav'
if (enteredWav !== currentWav) {
    error({
        en: `The new name must reference the same wav file as the current tier ("${currentWav}"), ` +
                'because the tier belongs to the TextGrid file of that wav file.',
        zh: `新名称必须引用与当前层相同的 wav 文件（"${currentWav}"），因为该层属于该 wav 文件对应的 TextGrid 文件。`,
        ja: `新しい名前は、現在のティアと同じ wav ファイル（「${currentWav}」）を参照する必要があります。` +
                'ティアはその wav ファイルの TextGrid ファイルに属しているためです。'
    })
}
modules[currentModuleIndex].name = newName
modules.sort((a, b) => a.name.localeCompare(b.name))
currentModuleIndex = modules.findIndex(module => module.name === newName)
