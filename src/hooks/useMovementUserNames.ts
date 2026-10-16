// src/hooks/useMovementUserNames.ts
// Resolves movement user ids to display names, caching them and showing
// "Vous" for the current user. Only fetches the users that are missing.
import {useEffect, useState} from 'react';
import {getUser} from '../api/user';
import {useAuth} from '../context/AuthContext';

function displayName(userId: number, meId: number | undefined, cache: Record<number, string>): string {
    if (meId != null && userId === meId) {
        return 'Vous';
    }
    return cache[userId] ?? `Utilisateur ${userId}`;
}

export function useMovementUserNames(userIds: number[]) {
    const {user: me} = useAuth();
    const [cache, setCache] = useState<Record<number, string>>({});

    useEffect(() => {
        const missing = Array.from(new Set(userIds)).filter(id => !cache[id] && id !== me?.id);
        if (missing.length === 0) return;

        let cancelled = false;
        (async () => {
            const entries: Array<[number, string]> = [];
            for (const userId of missing) {
                try {
                    const {data: u} = await getUser(String(userId));
                    const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
                    entries.push([userId, full || u.email || `Utilisateur ${userId}`]);
                } catch {
                    entries.push([userId, `Utilisateur ${userId}`]);
                }
            }
            if (!cancelled) {
                setCache(prev => {
                    const next = {...prev};
                    entries.forEach(([id, name]) => {
                        next[id] = name;
                    });
                    return next;
                });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userIds, cache, me?.id]);

    const getUserName = (userId: number) => displayName(userId, me?.id, cache);

    return {getUserName};
}
