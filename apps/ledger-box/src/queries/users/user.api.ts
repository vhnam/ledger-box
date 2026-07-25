import axios from 'axios';

import type { UserLookupDto } from './user.dto';

export async function fetchUserByEmail(email: string): Promise<UserLookupDto | null> {
  const { data } = await axios.get<UserLookupDto | null>('/api/users/by-email', {
    params: { email },
  });

  return data;
}
