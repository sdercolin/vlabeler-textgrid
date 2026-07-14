if (modules.length <= 1) {
    error({
        en: 'Cannot remove the only tier in the project.',
        zh: '无法删除项目中唯一的层。',
        ja: 'プロジェクト内の唯一のティアは削除できません。'
    })
}
modules.splice(currentModuleIndex, 1)
if (currentModuleIndex >= modules.length) {
    currentModuleIndex = modules.length - 1
}
