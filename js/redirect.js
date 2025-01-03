
const redirect = (link) => {
    let targetUrl;
    switch(link) {
        case 'homepage':
            targetUrl = '/web/利姆露的網路領域-首頁.html';
            break;
        case 'nav':
            targetUrl = '/nav.html';
            break;
        default:
            targetUrl = `/web/${link}.html`;
            console.log(targetUrl)
            break;
    }
    window.location.replace(targetUrl); // Use replace instead of href
}
