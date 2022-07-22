import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions } from 'jose';
import { URL } from 'url';

import type { JWTHeaderParameters, JWTPayload } from 'jose';
import type { Socket } from 'socket.io';

import env from 'dotenv';
env.config();

declare module 'socket.io' {
	interface Socket {
		auth?: { user: JWTPayload; header: JWTHeaderParameters };
	}
}

type SocketIOMiddlewareFactory = (
	domain?: string,
	audience?: string
) => (socket: Socket, next: (err?: Error) => void) => void;

const auth0Middleware: SocketIOMiddlewareFactory = (domainParam?: string, audienceParam?: string) => {
	const domain = domainParam ?? process.env.AUTH0_DOMAIN;
	const audience = audienceParam ?? process.env.AUTH0_AUDIENCE;

	if (!domain) {
		throw new Error(
			'Config error: Auth0 domain not found, did you pass the domain parameter or set AUTH0_DOMAIN ?'
		);
	}

	const JWKS = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));

	const config: JWTVerifyOptions = { issuer: `https://${domain}/` };

	if (audience !== undefined) {
		config.audience = audience;
	}

	return async function (socket, next) {
		const { token: authHandshakeToken } = socket.handshake.auth;

		if (typeof authHandshakeToken !== 'string') {
			return next(
				new Error(
					'No Authorization handshake information found, io({ auth: {token: "Bearer [token]" } }); https://socket.io/docs/v3/middlewares/#sending-credentials '
				)
			);
		}

		const authHandshakeTokenSplitted = authHandshakeToken.split(' ');

		if (authHandshakeTokenSplitted.length !== 2 || authHandshakeTokenSplitted[0] !== 'Bearer') {
			return next(new Error('Malformed Authorization handshake, should be: token: "Bearer [token]"'));
		}

		const jwt = authHandshakeTokenSplitted[1];

		try {
			const { payload, protectedHeader } = await jwtVerify(jwt, JWKS, config);

			socket.auth = { user: payload, header: protectedHeader };
		} catch (err) {
			return next(new Error('Failed to verify claims, user not authorized'));
		}

		return next();
	};
};

export default auth0Middleware;
