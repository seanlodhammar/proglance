import { Html, Button, Head, Container, Heading, Img, Text, Font } from "@react-email/components";
import * as React from "react";

const ResetPassword = (props: { resetId: string }) => {
    return (
        <Html lang='en'>
            <Head>
                <title>Proglance - Password Reset Confirmation</title>
                <Font fontFamily='Inter' fallbackFontFamily='Verdana' webFont={{ url: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Questrial&display=swap', format: 'woff2' }} fontWeight={400} fontStyle='normal' />
            </Head>
            <Container>
                <Img src='proglance-logo.png' draggable='false' />
                <Heading as='h2'>Reset Password</Heading>
                <Text>You have requested a password reset for your account. If you didn't request this, contact support@proglance.app</Text>                 
                <Button href={`http://localhost:3000/auth/reset-password/${props.resetId}`}>Reset</Button>
            </Container>
        </Html>
    )
}

export default ResetPassword;