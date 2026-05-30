import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";

@Controller('chat')
export class ChatController {

    constructor(
        private readonly chatService: ChatService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('global')
    findGlobalMessages(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.chatService.findGlobalMessages(
            req.user.userId,
            Number(page) || 1,
            Number(limit) || 30,
            search,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('global')
    creatMessage(
        @Req() req: any,
        @Body() dto: CreateMessageDto
    ) {
        return this.chatService.createMessage(
            req.user.userId,
            dto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('messages/:id/like')
    toggleLike(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.toggleLike(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete('messages/:id')
    deleteMessage(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.deleteMessage(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('friends/request/:id')
    sendFriendRequest(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.sendFriendRequest(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('friends/requests')
    findFriendRequests(
        @Req() req: any,
    ) {
        return this.chatService.findFriendRequests(
            req.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('friends/requests/:id/accept')
    acceptFriendRequest(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.acceptFriendRequest(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('friends/requests/:id/reject')
    rejectFriendRequest(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.rejectFriendRequest(
            req.user.userId,
            id,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('friends')
    findMyFriends(
        @Req() req: any,
    ) {
        return this.chatService.findMyFriends(
            req.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('interactions')
    findMyChatInteractions(
        @Req() req: any,
    ) {
        return this.chatService.findMyChatInteractions(
            req.user.userId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch('interactions/:id/dismiss')
    dismissInteraction(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.chatService.dismissInteraction(
            req.user.userId,
            id,
        );
    }
}