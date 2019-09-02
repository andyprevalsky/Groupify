import Link from 'next/link';

const Index = () => (
    <div>
        <Link href="/host">
            <a> Create a Room </a>
        </Link>
        <Link href="/guest">
            <a> Join a Room </a>
        </Link>
    </div>
  );
  
  export default Index;