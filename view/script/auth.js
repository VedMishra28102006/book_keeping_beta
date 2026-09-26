let user_token = null;
let cookies = document.cookie.split(";");
for (let i=0; i < cookies.length; i++) {
	cookies[i] = cookies[i].trim();
	cookies[i] = cookies[i].split("=");
	if (cookies[i][0] == "user_token") {
		user_token = cookies[i][1];
	}
}
let url_params = new URLSearchParams(window.location.search);
let uid = null;
let fy_id = null;
if (url_params.has("id")) {
	uid = url_params.get("id");
}
let user_status = null;
let user_role = null;
let audition = 0;
let auth_form = document.getElementById("auth_form");
let check_status = async (user_token) => {
	await fetch(`/status/${user_token}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			document.cookie = "user_token=; Path=/; Max-Age=0; SameSite=Strict; Secure";
			fy_form.setAttribute("action", "");
			user_form.setAttribute("action", "");
			window.location.href = "#auth";
			auth_form.parentNode.showModal();
			return;
		}
		user_status = data.user_status;
		user_role = data.user_role;
		uid = data.user_id;
		if (["admin", "auditor", "manager"].includes(data.user_role)) {
			document.getElementById("adminbtn").style.display = "flex";
			document.getElementById("adminbtn").style.visibility = "visible";
			if (user_role != "admin") {
				document.getElementById("expbtn").style.display = "none";
				document.getElementById("expbtn").style.visibility = "hidden";
				document.getElementById("impbtn").style.display = "none";
				document.getElementById("impbtn").style.visibility = "hidden";
				user_form.querySelector(".input_wrapper:has(#user_role)").style.display = "none";
				user_form.querySelector(".input_wrapper:has(#user_role)").style.visibility = "hidden";
				user_form.querySelector("label[for='user_role']").style.display = "none";
				user_form.querySelector("label[for='user_role']").style.visibility = "hidden";
				user_form.querySelector("label[for='user_department']").style.display = "none";
				user_form.querySelector("label[for='user_department']").style.visibility = "hidden";
				user_filter_form.querySelector("label[for='filter_department']").style.display = "none";
				user_filter_form.querySelector("label[for='filter_department']").style.visibility = "hidden";
				user_form.querySelector(".input_wrapper:has(#user_department)").style.display = "none";
				user_form.querySelector(".input_wrapper:has(#user_department)").style.visibility = "hidden";
				user_filter_form.querySelector(".input_wrapper:has(#filter_department)").style.display = "none";
				user_filter_form.querySelector(".input_wrapper:has(#filter_department)").style.visibility = "hidden";
				if (user_role == "auditor") {
					audition = uid;
					document.getElementById("crebtn").style.display = "none";
					document.getElementById("crebtn").style.visibility = "hidden";
					user_filter_form.querySelector("label[for='filter_role']").style.display = "block";
					user_filter_form.querySelector("label[for='filter_role']").style.visibility = "visible";
					user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.display = "flex";
					user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.visibility = "visible";
				} else {
					audition = 0;
					user_form.setAttribute("action", `/user/${user_token}`);
					if (user_role == "manager") {
						user_filter_form.querySelector("label[for='filter_role']").style.display = "none";
						user_filter_form.querySelector("label[for='filter_role']").style.visibility = "hidden";
						user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.display = "none";
						user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.visibility = "hidden";
						user_form.querySelector("#user_role").value = user_role;
						user_form.querySelector("#user_department").value = data.user_department;
					}
				}
			} else {
				user_form.setAttribute("action", `/user/${user_token}`);
				document.getElementById("expbtn").style.display = "flex";
				document.getElementById("expbtn").style.visibility = "visible";
				document.getElementById("impbtn").style.display = "flex";
				document.getElementById("impbtn").style.visibility = "visible";
				user_form.querySelector("label[for='user_role']").style.display = "block";
				user_form.querySelector("label[for='user_role']").style.visibility = "visible";
				user_filter_form.querySelector("label[for='filter_role']").style.display = "block";
				user_filter_form.querySelector("label[for='filter_role']").style.visibility = "visible";
				user_form.querySelector(".input_wrapper:has(#user_role)").style.display = "flex";
				user_form.querySelector(".input_wrapper:has(#user_role)").style.visibility = "visible";
				user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.display = "flex";
				user_filter_form.querySelector(".input_wrapper:has(#filter_role)").style.visibility = "visible";
				user_form.querySelector("label[for='user_department']").style.display = "block";
				user_form.querySelector("label[for='user_department']").style.visibility = "visible";
				user_filter_form.querySelector("label[for='filter_department']").style.display = "block";
				user_filter_form.querySelector("label[for='filter_department']").style.visibility = "visible";
				user_form.querySelector(".input_wrapper:has(#user_department)").style.display = "flex";
				user_form.querySelector(".input_wrapper:has(#user_department)").style.visibility = "visible";
				user_filter_form.querySelector(".input_wrapper:has(#filter_department)").style.display = "flex";
				user_filter_form.querySelector(".input_wrapper:has(#filter_department)").style.visibility = "visible";
				document.getElementById("crebtn").style.display = "flex";
				document.getElementById("crebtn").style.visibility = "visible";
				user_form.querySelector("#user_role").value = "accountant";
				user_form.querySelector("#user_department").value = "";
			}
			fetch_user();
		} else {
			document.getElementById("adminbtn").style.display = "none";
			document.getElementById("adminbtn").style.visibility = "hidden";
		}
		fetch_fy();
		fy_form.setAttribute("action", `/fy/${user_token}/${uid}/0`);
		window.location.href = "#fy_menu";
	})
	.catch(error => {
		alert(error);
	});
};
window.addEventListener("page_loaded", () => {
	if (!user_token) {
		window.location.href = "#auth";
		auth_form.parentNode.showModal();
	} else {
		check_status(user_token);
	}
});
auth_form.addEventListener("submit", async (event) => {
	event.preventDefault();
	await submit_form(auth_form).then(result => {
		if (result.success) {
			document.cookie = `user_token=${encodeURIComponent(result.user_token)};Max-Age=${365*24*60*60};Path=/;SameSite=Strict;Secure`;
			user_token = encodeURIComponent(result.user_token);
			auth_form.parentNode.close();
			window.location.href = "#fy_menu";
			check_status(user_token);
		}
	}).catch((error) => {
		alert(error.msg);
	});
});