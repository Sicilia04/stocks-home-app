export interface User {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    is_staff: boolean;
    is_active: boolean;
    is_superuser: boolean;
    last_login: string | null;
    date_joined: string;
}
