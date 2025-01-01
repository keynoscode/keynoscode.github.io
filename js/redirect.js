
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
            console.error('Invalid link specified');
            return;
    }
    window.location.replace(targetUrl); // Use replace instead of href
}
