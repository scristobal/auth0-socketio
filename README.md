# auth0-socketio

A near-zero config middleware to use Auth0 JWT on your Socket.IO server. You only need your Auth0 `domain` and optionally an `audience`.

It is build around ease of use, when you just need a single functionality.

-   The factory will try to find the config automatically.
-   The errors are as detailed as possible to guide you to the solution.
-   And it only imports two dependencies!

> Disclaimer: This is an open source project, not affiliated in any way with Auth0. Under GPL license. Use it at your own risk.

## Config

Install with `npm i auth0-socketio` or visit the [NPM package webpage](https://www.npmjs.com/package/auth0-socketio)

## Usage

You need your Auth0 [domain](https://auth0.com/docs/get-started/auth0-overview/create-tenants) in most cases something like `example-co.au.auth0.com` and optionally an [audience](https://auth0.com/docs/get-started/tenant-settings#api-authorization-settings)

### Server side

Import `auth0Middleware` from `auth0-socketio` and create your middleware with you `domain` (and optionally `audience`). Then apply it to your server as a regular [socket.io middleware](https://socket.io/docs/v4/middlewares/).

```typescript
import { Server } from 'socket.io';
import auth0Middleware from 'auth0-socketio';

const io = new Server();

const withAuthorization = auth0Middleware('example-co.au.auth0.com');

io.use(withAuthorization);
```

### Client side

Follow [Socket.IO documentation](https://socket.io/docs/v4/middlewares/#sending-credentials) to include your JWT on the authentication handshake:

```javascript
// plain object
const socket = io({
	auth: {
		token: 'abc'
	}
});

// or with a function
const socket = io({
	auth: (cb) => {
		cb({
			token: 'abc'
		});
	}
});
```

You can then access the token from the server side, that is what `auth0-socketio` exactly does.

It will validate the token against your `domain` and (optionally `audience`) returning an `Error` if the token is not valid or failed to be verified.

### Validate Audience

To validate claims against an `audience` use it as second parameter:

```typescript
import { Server } from 'socket.io';
import auth0Middleware from 'auth0-socketio';

const io = new Server();

const withAuthorization = auth0Middleware('example-co.au.auth0.com','example-audience);

io.use(withAuthorization);
```

### Environment variables

It is usual to have your Auth0 `domain` and `audience` as environment variables used by other parts of your application. If no parameters are provided `auth0-socketio` will try to use `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` from the environment or an `.env` file.

## Missing

There are no test at the moment.

## Alternatives

There a couple of alternatives that I tried before implementing my own, maybe they fit better your purpose:

-   [socketio-jwt](https://github.com/Thream/socketio-jwt) Possibly the closest to the original implementation, still active.
-   [socketio-jwt-auth](https://github.com/adcentury/socketio-jwt-auth) Similar to the previous one, a very good implementation.

However, I found both a bit cumbersome to use. You need to configure your secret and algorithm, for instance using `jwksClient` from `jwks-rsa` and your JWKS, and I wanted as little config as possible.

Also I personally didn't trust the JWT implementation they use. The former uses [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), while the latter uses [jwt-simple](https://www.npmjs.com/package/jwt-simple) both haven't been updated in years.

In addition neither of the packages implement claim verification, so you have to do the extra work on a very delicate area.

It is worth mentioning [socketio-jwt](https://www.npmjs.com/package/socketio-jwt) the original implementation from Auth0 community, no longer maintained but still good as a reference.
