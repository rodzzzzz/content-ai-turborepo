'use server';

import type { Provider } from '@/constants/providers';
import { currentUser } from '@/lib/auth';
import { getServerApiConfig } from '@/lib/server-api';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export const getIntegratedAccounts = async () => {
  try {
    const user = await currentUser();

    if (!user?.id || !user.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(
      `${apiUrl}/api/integration/accounts?${params.toString()}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return {
      success: 'Integrated accounts fetched successfully',
      integratedAccounts: data.integratedAccounts ?? [],
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const disconnectAccount = async (provider: Provider['provider']) => {
  try {
    const user = await currentUser();

    if (!user?.id || !user.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
      provider,
    });
    const res = await fetch(
      `${apiUrl}/api/integration/by-provider?${params.toString()}`,
      {
        method: 'DELETE',
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    if (data.warning) {
      return {
        success: data.success as string,
        warning: data.warning as string,
        deauthorizationResult: data.deauthorizationResult,
      };
    }

    return {
      success: data.success as string,
      deauthorizationResult: data.deauthorizationResult,
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};
