// A classroom keeps the same color wherever it appears, regardless of pagination.
const themes = [
    { gradient: 'linear-gradient(130deg, #4c4c4c 0%, #525252 100%)', accent: '#4b4b4b', soft: '#ededed', decoration: '#bfbfbf' },
    { gradient: 'linear-gradient(130deg, #575757 0%, #5b5b5b 100%)', accent: '#575757', soft: '#f0f0f0', decoration: '#cdcdcd' },
    { gradient: 'linear-gradient(130deg, #555555 0%, #5a5a5a 100%)', accent: '#525252', soft: '#f2f2f2', decoration: '#d3d3d3' },
    { gradient: 'linear-gradient(130deg, #494949 0%, #565656 100%)', accent: '#4a4a4a', soft: '#ededed', decoration: '#cacaca' },
    { gradient: 'linear-gradient(130deg, #505050 0%, #5f5f5f 100%)', accent: '#505050', soft: '#efefef', decoration: '#d0d0d0' },
    { gradient: 'linear-gradient(130deg, #535353 0%, #545454 100%)', accent: '#535353', soft: '#efefef', decoration: '#c7c7c7' },
] as const;

export function getClassroomTheme(id: number) {
    return themes[((id - 1) % themes.length + themes.length) % themes.length];
}
