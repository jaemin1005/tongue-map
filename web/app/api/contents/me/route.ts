import { ErrMsg } from "@/interface/err.dto";
import { ERROR_MSG } from "@/static/log/error_msg";
import { NextRequest, NextResponse } from "next/server";

// 사용자 정보를 반환하는 핸들러 (GET 메서드)
export async function GET(req: NextRequest) {
  // Authorization 헤더에서 액세스 토큰 가져오기
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "인증 토큰이 없습니다." },
      { status: 401 }
    );
  }

  try {
    // Actix Web 서버로 사용자 정보 요청 전송
    const response = await fetch("http://localhost:3001/map_me", {
      method: "GET",
      headers: {
        Authorization: `${authHeader}`, // 액세스 토큰을 헤더에 포함
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      const data = (await response.json()) as ErrMsg;
      console.error(data.message);
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error(ERROR_MSG.INTERNAL_SERVER_ERROR, error);
    return NextResponse.json(
      { message: ERROR_MSG.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
