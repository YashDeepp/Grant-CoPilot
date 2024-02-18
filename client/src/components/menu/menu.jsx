import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Bar,
  LogOut,
  Message,
  Plus,
  Settings,
  Tab,
  Tick,
  Trash,
  Xicon,
} from "../../assets/";
import Profile from "../../assets/Profile";
import { emptyUser } from "../../redux/user";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { activePage, addHistory } from "../../redux/history";
import instance from "../../config/instance";
import "./style.scss";

const Menu = ({ changeColorMode }) => {
  let path = window.location.pathname;

  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const settingRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { history } = useSelector((state) => state);
  const [confirm, setConfim] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileName, setProfileName] = useState("Anonymous User");

  const updateUser = async () => {
    let res = null;
    try {
      res = await instance.get("update user route url");
    } catch (err) {
      console.log(err);
    } finally {
      if (res?.data?.status === 200) {
        setProfileName(res?.data?.data?.name);
        setProfilePicture(res?.data?.data?.profilePicture);
      }
    }
  };

  const logOut = async () => {
    if (window.confirm("Do you want log out")) {
      let res = null;
      try {
        res = await instance.get("/api/user/logout");
      } catch (err) {
        alert(err);
      } finally {
        if (res?.data?.status === 200) {
          alert("Done");
          dispatch(emptyUser());
          navigate("/login");
        }
      }
    }
  };

  const clearHistory = async (del) => {
    if (del) {
      let res = null;

      try {
        res = instance.delete("/api/chat/all");
      } catch (err) {
        alert("Error");
        console.log(err);
      } finally {
        if (res) {
          navigate("/chat");
          dispatch(addHistory([]));
        }

        setConfim(false);
      }
    } else {
      setConfim(true);
    }
  };

  const showMenuMd = () => {
    menuRef.current.classList.add("showMd");
    document.body.style.overflowY = "hidden";
  };

  //Menu

  useEffect(() => {
    window.addEventListener("click", (e) => {
      if (
        !menuRef?.current?.contains(e.target) &&
        !btnRef?.current?.contains(e.target)
      ) {
        menuRef?.current?.classList?.remove("showMd");
        document.body.style.overflowY = "auto";
      }
    });

    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width:767px)").matches) {
        document.body.style.overflowY = "auto";
      } else {
        if (menuRef?.current?.classList?.contains("showMd")) {
          document.body.style.overflowY = "hidden";
        } else {
          document.body.style.overflowY = "auto";
        }
      }
    });
  });

  // History Get
  useEffect(() => {
    const getHistory = async () => {
      let res = null;
      try {
        res = await instance.get("/api/chat/history");
      } catch (err) {
        console.log(err);
      } finally {
        if (res?.data) {
          console.log(res.data.data);
          dispatch(addHistory(res?.data?.data));
        }
      }
    };

    getHistory();
  }, [path]);

  // History active
  useEffect(() => {
    setConfim(false);
    let chatId = path.replace("/chat/", "");
    chatId = chatId.replace("/", "");
    dispatch(activePage(chatId));
  }, [path, history]);

  return (
    <Fragment>
      <Modal
        changeColorMode={changeColorMode}
        settingRef={settingRef}
        updateUser={updateUser}
      />

      <header>
        <div className="start">
          <button onClick={showMenuMd} ref={btnRef}>
            <Bar />
          </button>
        </div>

        <div className="title">
          {path.length > 6 ? history[0]?.prompt : "New chat"}
        </div>

        <div className="end">
          <button
            onClick={() => {
              if (path.includes("/chat")) {
                navigate("/");
              } else {
                navigate("/chat");
              }
            }}
          >
            <Plus />
          </button>
        </div>
      </header>

      <div className="menu" ref={menuRef}>
        <div>
          <button
            type="button"
            aria-label="new"
            onClick={() => {
              if (path.includes("/chat")) {
                navigate("/");
              } else {
                navigate("/chat");
              }
            }}
          >
            <Plus />
            New chat
          </button>
        </div>

        <div className="history">
          {history?.map((obj, key) => {
            console.log(obj)
            if(!obj?.chatId || obj.chat.length === 0) return null;
            if (obj?.active) {
              return (
                <button
                  key={key}
                  className="active"
                  onClick={() => {
                    navigate(`/chat/${obj?.chatId}`);
                  }}
                >
                  <Message />
                  {obj?.chat[0]?.prompt}
                </button>
              );
            } else {
              return (
                <button
                  key={key}
                  onClick={() => {
                    navigate(`/chat/${obj?.chatId}`);
                  }}
                >
                  <Message />
                  {obj?.chat[0]?.prompt}
                </button>
              );
            }
          })}
        </div>

        <div className="actions">
          {history?.length > 0 && (
            <>
              {confirm ? (
                <button onClick={() => clearHistory(true)}>
                  <Tick />
                  Confirm clear conversations
                </button>
              ) : (
                <button onClick={() => clearHistory(false)}>
                  <Trash />
                  Clear conversations
                </button>
              )}
            </>
          )}
          <button
            onClick={() => {
              if (settingRef?.current) {
                settingRef.current.classList.add("clicked");
                settingRef.current.style.display = "flex";
              }
            }}
          >
            <Settings />
            Settings
          </button>
          <button
            onClick={() => {
              window.open(
                "https://platform.openai.com/docs/guides/prompt-engineering",
                "_blank"
              );
            }}
          >
            <Tab />
            Prompt Assist
          </button>
          <button onClick={logOut}>
            <LogOut />
            Log out
          </button>
          <button>
            <Profile profilePicture={profilePicture} />
            {profileName}
          </button>
        </div>
      </div>

      <div className="exitMenu">
        <button>
          <Xicon />
        </button>
      </div>
    </Fragment>
  );
};

export default Menu;

const Modal = ({ changeColorMode, settingRef, updateUser }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const deleteAccount = async () => {
    if (window.confirm("Do you want delete your account")) {
      let res = null;
      try {
        res = await instance.delete("/api/user/account");
      } catch (err) {
        console.log(err);
        if (err?.response?.data?.status === 405) {
          alert("Not Logged");
          dispatch(emptyUser());
          navigate("/login");
        } else {
          alert(err);
        }
      } finally {
        alert("Success");
        dispatch(emptyUser());
        navigate("/login");
      }
    }
  };

  return (
    <div
      className="settingsModal"
      ref={settingRef}
      onClick={(e) => {
        let inner = settingRef.current.childNodes;
        if (!inner?.[0]?.contains(e.target)) {
          settingRef.current.style.display = "none";
        }
      }}
    >
      <div className="inner">
        <div
          className="content top"
          style={{ display: "flex", flexDirection: "row" }}
        >
          <h3>Settings</h3>
          <button
            onClick={() => {
              settingRef.current.style.display = "none";
            }}
          >
            <Xicon />
          </button>
        </div>
        <div className="content ceneter">
          <div className="content-input">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" className="" />
          </div>
          <div className="content-input">
            <label htmlFor="profile-picture">Profile Picture</label>
            <input type="file" id="profile-picture" />
          </div>
          <div className="content-submit">
            <div>
              <p>Dark mode</p>
              <button
                onClick={() => {
                  let mode = localStorage.getItem("darkMode");
                  if (mode) {
                    changeColorMode(false);
                  } else {
                    changeColorMode(true);
                  }
                }}
                role="switch"
                type="button"
              >
                <div></div>
              </button>
            </div>

            <button className="content-button" onClick={updateUser}>
              Update
            </button>
          </div>
        </div>
        <div className="bottum">
          <button>Export data</button>
          <button className="end" onClick={deleteAccount}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
};
