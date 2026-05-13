import LoginCard from "./components/LoginCard";
import Buhoimg from "./components/Buhoimg";

export default function App() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-10">

      <div className="
        w-full max-w-[1200px]
        h-[700px]
        bg-white
        rounded-[30px]
        shadow-[0_20px_60px_rgba(0,0,0,0.08)]
        flex
        overflow-hidden
      ">

        {/* IZQUIERDA */}
        <div className="
          w-[45%]
          flex items-center justify-center
          px-20
        ">
          <LoginCard />
        </div>

        {/* DERECHA */}
        <div className="
          w-[55%]
          flex items-center justify-center
          bg-[#F7F7FB]
        ">
          <Buhoimg />
        </div>

      </div>

    </div>
  );
}