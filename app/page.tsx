import Image from "next/image";
import Header from "./component/Header";
import Main from "./component/Main";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Main />
    </div>
  );
}
