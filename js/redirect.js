
const redirect = (link) => {
 window.onload = execute(link)
}

const execute = (link) => {
    switch(link) {
        case 'homepage':
            link = '../web/利姆露的網路領域-首頁.html';
            break;
        case 'nav':
            link = '../nav.html';
            break;
        default:
            console.error('Invalid link specified');
            return;
    }
    window.location.href = link;
}

