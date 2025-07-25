import { GetStaticProps } from 'next';
import Layout from '../src/components/Layout';
import Home from '../src/pages/Home';

export default function HomePage() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 60, // Revalidate every 60 seconds
  };
};