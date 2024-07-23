import styles from '../page.module.css';
import Email from '@/app/_components/Auth/ResetPassword/Email/Email';

const ResetPassword = () => {
    return (
        <main className={styles['auth-page']}>
            <Email />
        </main>
    )
}

export default ResetPassword;