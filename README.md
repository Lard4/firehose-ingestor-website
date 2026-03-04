# firehose-ingestor-website

This is a Vanilla JS website hosted on Vercel: https://firehose-ingestor-website.vercel.app/

### Nothing is actually loading for me on the website?!

The backend services, when running, are hosted on my laptop and served via [`ngrok`](https://ngrok.com), so when I am not running both backend services and a Kafka container, the website will not show posts. This is an experimental site ran with ~~best-~~ low-effort infrastructure, since I don't want to pay to host such a silly website. 

The backend services can be found here: https://github.com/Lard4/firehose-ingestor

### About

I chose this as a personal/experimental project to get more exposure to Go, Kafka, and Websockets. The true learnings for me lay in the backend systems powering this website. But, like all good backend systems, they're pretty useless if you're not doing anything to display the data they're processing, so I made this hacky stupid Vanilla JS website to show it off. The backend is actually kind of neat, so I would recommend checking out what's there instead of what's here. 