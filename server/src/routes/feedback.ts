import { BAD_REQUEST, OK } from 'http-status-codes';
import Router from 'koa-router';
import { getRepository } from 'typeorm';
import { DiscordService } from '../integrations';
import { ILogger } from '../logger';
import { Feedback, PrivateFeedback, User } from '../models';
import { guard } from './guards';
import { setResponse } from './utils';

type GratitudeInput = {
  toUserId: number;
  comment: string;
  badgeId?: string;
};

type FeedbackInput = {
  toUserId: number;
  comment: string;
};

export function feedbackRoute(logger: ILogger) {
  const router = new Router({ prefix: '/feedback' });
  router.post('/private', guard, postPrivateFeedback(logger));
  router.post('/gratitude', guard, postGratitudeFeedback(logger));
  return router;
}

const postPrivateFeedback = (_: ILogger) => {
  return async (ctx: Router.RouterContext) => {
    const courseId: number = ctx.params.courseId;
    const data: FeedbackInput = ctx.request.body;

    if (isNaN(data.toUserId)) {
      setResponse(ctx, BAD_REQUEST);
      return;
    }

    const id = ctx.state.user.id;
    const feedback: Partial<PrivateFeedback> = {
      comment: data.comment,
      course: courseId,
      fromUser: id,
      toUser: data.toUserId,
    };
    const result = await getRepository(PrivateFeedback).save(feedback);

    setResponse(ctx, OK, result);
    return;
  };
};

// const isValidName = (name: string) => typeof name === 'string' && name.trim().length > 0;

// const getUserDisplayName = (data: User) => {
//   let name = data.githubId;
//   if (isValidName(data.firstName) || isValidName(data.lastName)) {
//     name = `${data.firstName} ${data.lastName}`;
//   }
//   return name;
// };

const postGratitudeFeedback = (logger: ILogger) => {
  // const heroesService = new HeroesService(logger);
  // const SUPPORTED_BADGE_IDS = [
  //   'Congratulations',
  //   'Expert_help',
  //   'Great_speaker',
  //   'Good_job',
  //   'Helping_hand',
  //   'Hero',
  //   'Thank_you',
  // ];
  const discordService = new DiscordService(logger);

  // const postToHeroes = (fromUser: User | undefined, toUser: User | undefined, data: FeedbackInput) => {
  //   if (
  //     !fromUser ||
  //     !fromUser.primaryEmail ||
  //     !toUser ||
  //     !toUser.primaryEmail ||
  //     !data.badgeId ||
  //     !heroesService.isCommentValid(data.comment)
  //   ) {
  //     return Promise.resolve(null);
  //   }
  //   return heroesService.assignBadge({
  //     assignerEmail: fromUser.primaryEmail,
  //     assignerName: getUserDisplayName(fromUser),
  //     receiverEmail: toUser!.primaryEmail,
  //     receiverName: getUserDisplayName(toUser),
  //     comment: data.comment,
  //     event: data.badgeId,
  //   });
  // };

  const postToDiscord = (fromUser: User | undefined, toUser: User | undefined, data: FeedbackInput) => {
    if (!fromUser || !toUser || !data.comment) {
      return Promise.resolve(null);
    }
    return discordService.pushGratitude({
      toGithubId: toUser.githubId,
      fromGithubId: fromUser.githubId,
      comment: data.comment,
    });
  };

  return async (ctx: Router.RouterContext) => {
    const courseId: number = ctx.params.courseId;
    const data: GratitudeInput = ctx.request.body;

    if (isNaN(data.toUserId)) {
      setResponse(ctx, BAD_REQUEST);
      return;
    }

    const id = ctx.state.user.id;
    const userRepository = getRepository(User);
    const [fromUser, toUser] = await Promise.all([userRepository.findOne(id), userRepository.findOne(data.toUserId)]);

    // const heroesUrl = await postToHeroes(fromUser, toUser, data);
    await postToDiscord(fromUser, toUser, data);
    const feedback: Partial<Feedback> = {
      comment: data.comment,
      // badgeId: data.badgeId ? data.badgeId : undefined,
      course: courseId,
      fromUser: id,
      toUser: data.toUserId,
      heroesUrl: undefined,
    };
    const result = await getRepository(Feedback).save(feedback);

    setResponse(ctx, OK, result);
    return;
  };
};
