"use client";

import { ERROR_MSG } from "@/static/error_msg";
import { INIT_LOCATION_INFO } from "@/static/location";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import SideButtonComponent from "@/components/side_button_component";
import { WriteModal } from "@/components/modal/write_modal";
import { useMark } from "@/context/mark_context";
import { SpeedDial } from "@/components/speed_dial_component";
import PersonIcon from "@mui/icons-material/Person";
import { LoginModal } from "@/components/modal/login_modal";
import { LOGIN_MSG } from "@/static/login_msg";
import { useAuth } from "@/context/auth_context";
import { useToast } from "@/components/toast/toast_hook";
import { ToastComponent } from "@/components/toast/toast_component";
import { isValidEmail } from "@/Func/validate";
import { TOAST_MSG } from "@/static/toast_msg";

// 클라이언트에서만 랜더링 되도록 설정한다.
const MapComponent = dynamic(() => import("../components/map_component"), {
  ssr: false,
});
const MarkerComponent = dynamic(
  () => import("../components/marker_component"),
  {
    ssr: false,
  }
);

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(
    INIT_LOCATION_INFO.COORDINATE
  );
  const mapRef = useRef<L.Map | null>(null);
  const [clickPosition, setClickPosition] = useState<[number, number] | null>(
    null
  );

  const [mark, setMark] = useState<boolean>(false);

  const {open, type, msg, time, setOpen, showToast } = useToast();

  //#region  --modal 상태관리--

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  //#endregion

  //#region  --context 관리--

  const { marks, addMark } = useMark();

  const { user, setUser, loading, logout, accessToken, setAccessToken } = useAuth();

  //#endregion

  useEffect(() => {
    // 현 위치 좌표가져오기
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error(ERROR_MSG.GEOLOCATION_GETTING_FAIL, error);
        }
      );
    } else {
      console.log(ERROR_MSG.GEOLOCATION_NOT_AVAILABLE);
    }
  }, []);

  const onMapClick = (event: L.LeafletMouseEvent) => {
    if (mark) {
      setClickPosition([event.latlng.lat, event.latlng.lng]);
      setIsWriteModalOpen(true);
    }
  };

  const cbSaveBtn = (files: File[], title: string, body: string) => {
    if (clickPosition === null) return;

    addMark({
      files,
      title,
      body,
      point: clickPosition,
    });
  };

  /**
   * 로그인 함수
   * email과 password를 매개변수로 받아, 로그인을 한다.
   * @param email userid
   * @param password password
   */
  const loginFunc = async (email: string, password: string) => {

    if(isValidEmail(email) === false) {
      showToast(TOAST_MSG.INVALID_EMAIL, "error");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // 쿠키 포함
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // 유저 저장
        setUser(data.user);
        // access 토큰 저장 
        setAccessToken(data.accessToken); 
      } else {
        showToast(TOAST_MSG.LOGIN_FAIL, "error");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      showToast(TOAST_MSG.LOGIN_ERROR, "error");
    }
  };

  return (
    <div className="w-screen h-screen relative">
      <MapComponent
        center={currentLocation}
        zoom={INIT_LOCATION_INFO.ZOOM}
        onMapReady={(map) => {
          mapRef.current = map;
        }}
        onMapClick={onMapClick}
      >
        <MarkerComponent></MarkerComponent>
      </MapComponent>
      <SideButtonComponent
        mapRef={mapRef}
        toggleMark={[
          mark,
          () => {
            setMark((prev) => !prev);
          },
        ]}
      />
      <WriteModal
        open={isWriteModalOpen}
        onOpenChange={() => {
          setIsWriteModalOpen((prev) => !prev);
        }}
        cbSaveBtn={cbSaveBtn}
      />
      <LoginModal
        title={LOGIN_MSG.TITLE}
        forgetPasswordMsg={LOGIN_MSG.FORGET_PASSWORD_MSG}
        handleForgetPassword={() => {}}
        loginMsg={LOGIN_MSG.LOGIN_BUTTON_MSG}
        handleLogin={loginFunc}
        open={isLoginModalOpen}
        onOpenChange={() => {
          setIsLoginModalOpen((prev) => !prev);
        }}
      ></LoginModal>
      <SpeedDial
        actions={[
          {
            key: "login",
            icon: <PersonIcon />,
            tooltipTitle: "login",
            onClick: () => {
              setIsLoginModalOpen(true);
            },
          },
        ]}
      ></SpeedDial>
      <ToastComponent open={open} setOpen={setOpen} type={type} time={time} msg={msg}/>
    </div>
  );
}
