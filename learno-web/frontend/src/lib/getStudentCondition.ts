import { API_BASE_URL } from '@/lib/config';
import type { Condition } from '@/lib/themes';

export const normalizeCondition = (raw: string | null | undefined): Condition => {
  if (!raw) {
    return 'default';
  }

  const value = raw.trim().toLowerCase();
  if (value === 'autism' || value === 'autism_support' || value === 'asc') {
    return 'asd';
  }

  if (
    value === 'adhd' ||
    value === 'asd' ||
    value === 'dyslexia' ||
    value === 'dyscalculia' ||
    value === 'anxiety' ||
    value === 'depression' ||
    value === 'default'
  ) {
    return value;
  }

  return 'default';
};

interface StudentConditionResponse {
  condition?: string | null;
  rawCondition?: string | null;
}

export async function getStudentCondition(token?: string | null): Promise<Condition> {
  if (!token) {
    return 'default';
  }

  try {
    const response = await fetch(`${API_BASE_URL}/neuro/student-condition`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return 'default';
    }

    const data = (await response.json()) as StudentConditionResponse;

    return normalizeCondition(data.condition ?? data.rawCondition);
  } catch {
    return 'default';
  }
}
