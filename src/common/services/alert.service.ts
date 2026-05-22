import { Injectable } from "@nestjs/common";

@Injectable()
export class AlertService {
    
    success(message: string, data?: any) {
        return {
            success: true,
            message,
            data: data || null,
            timeStamp: new Date(),
        };
    }
    error(message: string, error?: any) {
        return {
            success: false,
            message,
            error: error || null,
            timestamp: new Date(),
        };
    }
    warning(message: string, data?: any) {
        return {
            success: false,
            warning: true,
            message,
            data: data || null,
            timeStamp: new Date(),
        };
    }
    info(message: string, data?: any) {
        return {
            success: true,
            info: true,
            message,
            data: data || null,
            timeStamp: new Date(),
        }
    }
}