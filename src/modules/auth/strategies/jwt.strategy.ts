import { Injectable } from "@nestjs/common";

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey: 'cola_troca_secret_dev',
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.sub,
            email: payload.email,
        }
    }
}