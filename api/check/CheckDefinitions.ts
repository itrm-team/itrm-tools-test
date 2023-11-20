import { Request } from 'express';
import { APICheck, APICheckResult, APICheckConfig } from '../../../dist';

export interface TestCheckerConfig extends APICheckConfig {
    key: string
}

export class TestCheck implements APICheck {
    
    public getConfig(): TestCheckerConfig {
        return {
            check: 'test',
            key: 'valid'
        };
    }

    public async apply(config: TestCheckerConfig, req: Request): Promise<APICheckResult> {
        const { key } = req.query;
        if (config.key === key)
            return { approved: true, payload: { message: 'Accepted' } };
        if (key === 'unknown')
            return { approved: false };
        return {
            approved: false,
            rejection: {
                code: 401,
                payload: { message: 'key does not match' }
            }
        };
    }
}

export class UnexpectedErrorTestCheck implements APICheck {
    
    public getConfig(): APICheckConfig {
        return {
            check: 'unexpectedError'
        };
    }

    public async apply(config: TestCheckerConfig, req: Request): Promise<APICheckResult> {
        throw 'Unexpected error';
    }
}

export const check = new TestCheck();
export const unexpectedErrorCheck = new UnexpectedErrorTestCheck();