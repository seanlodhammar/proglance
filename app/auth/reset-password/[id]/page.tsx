import styles from '../../page.module.css';
import Reset from '@/app/_components/Auth/ResetPassword/Reset/Reset';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ResetPage = async({ params: { id }}: { params: { id: string } }) => {
    try {
        const cookieStr = cookies().toString();
        const get = await fetch(`${process.env.BASE_URL}/api/auth/reset-password/${id}`, { method: 'GET', headers: { Cookie: cookieStr }, credentials: 'include' });
        if(get.status !== 200) return redirect('/auth/login');
        return (
            <main className={styles['auth-page']}>
                <Reset id={id}/>
            </main>
        )
    } catch (err) {
        return redirect('/auth/login');
    }
}

export default ResetPage;