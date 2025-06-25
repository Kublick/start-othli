import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface ConfirmationEmailProps {
  name: string;
  confirmationUrl: string;
}

const EmailConfirmation = ({
  name,
  confirmationUrl,
}: ConfirmationEmailProps) => {
  return (
    <Html>
      <Tailwind>
        <Head>
          <title>Confirm Your Email Address</title>
        </Head>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[20px]">
            <Heading className="mt-[10px] mb-[24px] font-bold text-[24px] text-gray-800">
              Welcome, {name}!
            </Heading>
            <Text className="mb-[12px] text-[16px] text-gray-600 leading-[24px]">
              Thank you for registering with us. We're excited to have you on
              board!
            </Text>
            <Text className="mb-[24px] text-[16px] text-gray-600 leading-[24px]">
              To complete your registration and verify your account, please
              click the button below:
            </Text>
            <Section className="mb-[32px] text-center">
              <Button
                className="box-border rounded-[4px] bg-blue-600 px-[24px] py-[12px] text-center font-bold text-white no-underline"
                href={confirmationUrl}
              >
                Confirm Email Address
              </Button>
            </Section>
            <Text className="mb-[12px] text-[14px] text-gray-600 leading-[24px]">
              If you did not create an account, you can safely ignore this
              email.
            </Text>
            <Text className="mb-[24px] text-[14px] text-gray-600 leading-[24px]">
              This confirmation link will expire in 24 hours.
            </Text>
            <Text className="mb-[12px] text-[14px] text-gray-600 leading-[24px]">
              If the button above doesn't work, copy and paste the following
              link into your browser:
            </Text>
            <Text className="mb-[24px] break-all text-[14px] text-gray-600 leading-[24px]">
              <Link href={confirmationUrl} className="text-blue-600 underline">
                {confirmationUrl}
              </Link>
            </Text>
            <Hr className="my-[24px] border-gray-200" />
            <Text className="mb-[12px] text-[12px] text-gray-500 leading-[16px]">
              Si tienes preguntas, contacta al equipo de soporte
            </Text>
            <Text className="m-0 text-[12px] text-gray-500 leading-[16px]">
              © {new Date().getFullYear()} Ometomi . Todos los derechos
              reservados.
            </Text>
            <Text className="m-0 text-[12px] text-gray-500 leading-[16px]">
              Mexico
            </Text>
            <Text className="m-0 text-[12px] text-gray-500 leading-[16px]">
              <Link href="#" className="text-gray-500 underline">
                Unsubscribe
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailConfirmation;
