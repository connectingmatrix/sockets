import { decodeDashedAccessToken } from '@giga/shared/lib/helper';
import { GigaORM } from '@connectingmatrix/orm/orm/giga-orm-v2';
import { ensureEntityOrmInstalled } from '@connectingmatrix/orm/services/graphql/entity-request-context';
import { UserEntity } from '@connectingmatrix/orm/repositories/entities';
import { readAppAccessToken } from '@giga/permissions/services/auth/app-auth-token';
import { SupabaseClientAdmin } from '@giga/general/decorators/integration/supabase-admin-client';
import { createUserSupabaseClient } from '@giga/general/decorators/integration/user-supabase-client';
import { parseAccessTokenPayload } from './auth-token.socket';

const attachAuthMetadata = <TClient extends object>(client: TClient, userId: string, accessToken: string): TClient => {
  Object.assign(client, {
    __auth_user_id: userId,
    __access_token: accessToken,
  });
  return client;
};

const assertExistingUser = async (userId: string) => {
  await ensureEntityOrmInstalled();
  const user = await GigaORM.run({ caller: { id: 'chat-socket-auth', type: 'root' } }, async () => UserEntity.single(userId));
  if (!user?.id) throw new Error('Unauthorized');
};

export const buildSocketSession = async (tokenPayload: string) => {
  const accessToken = parseAccessTokenPayload(tokenPayload);
  if (!accessToken) {
    throw new Error('Missing access token.');
  }

  const appUser = readAppAccessToken(accessToken);
  if (appUser?.sub) {
    await assertExistingUser(appUser.sub);
    return {
      accessToken,
      mode: 'admin' as const,
      supabase: attachAuthMetadata(SupabaseClientAdmin(), appUser.sub, accessToken),
      userId: appUser.sub,
    };
  }

  const dashedUserId = decodeDashedAccessToken(accessToken);
  if (dashedUserId) {
    await assertExistingUser(dashedUserId);
    return {
      accessToken,
      mode: 'admin' as const,
      supabase: attachAuthMetadata(SupabaseClientAdmin(), dashedUserId, accessToken),
      userId: dashedUserId,
    };
  }

  const supabase = createUserSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user?.id) {
    throw new Error(error?.message || 'Unauthorized');
  }

  return {
    accessToken,
    mode: 'user' as const,
    supabase: attachAuthMetadata(supabase, data.user.id, accessToken),
    userId: data.user.id,
  };
};
