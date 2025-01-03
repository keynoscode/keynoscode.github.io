// icon.js
const icon = {
 name: 'icon',
 description: 'default icon setup for all webpages',
 execute: function(who) {
     const favicon = document.createElement('link');
     favicon.rel = 'icon';
     favicon.type = 'image/x-icon';
     favicon.href = `/webpic/${who}/icon/1.png`;
     document.head.appendChild(favicon);
 }
};
