import * as Sentry from "@sentry/nextjs";
import { NextPageContext } from "next";
import NextError from "next/error";

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function CustomErrorComponent({
  statusCode,
  hasGetInitialPropsRun,
  err,
}: ErrorProps) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.tsx so it can be captured
    Sentry.captureException(err);
  }

  return <NextError statusCode={statusCode} />;
}

CustomErrorComponent.getInitialProps = async (context: NextPageContext) => {
  const errorInitialProps = await NextError.getInitialProps(context);

  const { res, err, asPath } = context;

  // Workaround for https://github.com/vercel/next.js/issues/8592, mark when
  // getInitialProps has run
  if (res) {
    (errorInitialProps as ErrorProps).hasGetInitialPropsRun = true;
  }

  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's `getInitialProps`
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an error was caught somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was not handled by a React component's
  //    error boundary.

  if (err) {
    Sentry.captureException(err);

    // Flushing before returning is necessary if deploying to Vercel, see
    // https://vercel.com/docs/platform/limits#streaming-responses
    await Sentry.flush(2000);

    return errorInitialProps;
  }

  // If this point is reached, getInitialProps was called without any
  // information about what the error might be. This is unexpected and may
  // indicate a bug in Next.js, so record it in Sentry
  Sentry.captureException(
    new Error(`_error.js getInitialProps missing data at path: ${asPath}`)
  );
  await Sentry.flush(2000);

  return errorInitialProps;
};

export default CustomErrorComponent;

