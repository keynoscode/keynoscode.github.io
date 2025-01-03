document.addEventListener('DOMContentLoaded', () => {
 // Create and append meta tags dynamically

 const head = document.head;

 // Meta Tags for SEO
 const metaCharset = document.createElement('meta');
 metaCharset.setAttribute('charset', 'utf-8');
 head.appendChild(metaCharset);

 const metaViewport = document.createElement('meta');
 metaViewport.setAttribute('name', 'viewport');
 metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
 head.appendChild(metaViewport);

 const metaHttpEquiv = document.createElement('meta');
 metaHttpEquiv.setAttribute('http-equiv', 'X-UA-Compatible');
 metaHttpEquiv.setAttribute('content', 'IE=edge');
 head.appendChild(metaHttpEquiv);

 const metaRobots = document.createElement('meta');
 metaRobots.setAttribute('name', 'robots');
 metaRobots.setAttribute('content', 'index, follow');
 head.appendChild(metaRobots);

 const metaKeywords = document.createElement('meta');
 metaKeywords.setAttribute('name', 'keywords');
 metaKeywords.setAttribute('content', 'Rimuru, Anime Playlist, 利姆露的動畫列表, Tensura, anime music video, Rimuru anime playlist, anime AMV');
 head.appendChild(metaKeywords);

 const metaDescription = document.createElement('meta');
 metaDescription.setAttribute('name', 'description');
 metaDescription.setAttribute('content', 'Explore Rimuru\'s anime playlist featuring AMVs, popular anime clips, and much more! Join the community and enjoy the content.');
 head.appendChild(metaDescription);

 // Open Graph Meta Tags (for social media sharing)
 const ogTitle = document.createElement('meta');
 ogTitle.setAttribute('property', 'og:title');
 ogTitle.setAttribute('content', 'Rimuru\'s Anime Playlist - 利姆露的動畫列表');
 head.appendChild(ogTitle);

 const ogDescription = document.createElement('meta');
 ogDescription.setAttribute('property', 'og:description');
 ogDescription.setAttribute('content', 'Check out Rimuru\'s anime playlist with anime music videos, and join the Discord community to discuss anime.');
 head.appendChild(ogDescription);

 const ogImage = document.createElement('meta');
 ogImage.setAttribute('property', 'og:image');
 ogImage.setAttribute('content', '/webpic/rimuru/icon/1.png'); // Replace with an actual image URL
 head.appendChild(ogImage);

 const ogUrl = document.createElement('meta');
 ogUrl.setAttribute('property', 'og:url');
 ogUrl.setAttribute('content', '/web/利姆露的動畫列表.html'); // Replace with your actual URL
 head.appendChild(ogUrl);
});