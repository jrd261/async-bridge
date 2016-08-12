
# Asyncrounous Bridge

Generice promise based request/response interface. Intended for use with post-messaging.


# Example

```javascript
const Bridge = require('async-bridge');

const bridge = Bridge.create();

addEventListener('message', event => bridge.receiver(event.data));

bridge.emitter = data => window.parent.postMessage(data, '*');

bridge.respond('getRandomNumber', () => Math.random());

// Timeout of 1s.
bridge.request('hello?', { data: '123' }, 1000).then(response => {}).catch(error => {});
```

# Syncing

If the connection to the bridge may have been lost or if requests may have been sent before the other bridge was ready, "bridge.sync(timeout)" will attempt to syncronize the state of the two bridges. This prevents requests from being dropped.

One could sync on an interval "setInterval(bridge.sync, 2000)" for robustness, or use external events to know when a resync may be necessary. 






