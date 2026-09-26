let page_load_layout = `<!-- Page Load Layout Start -->
	<div aria-busy="true" aria-live="polite" id="page_load">
		<img alt="Book Keeping - Logo" src="icon/logo.svg" />
		<p>Loading, please wait...</p>
	</div>
<!-- Page Load Layout End -->`;
let auth_layout = `<!-- Start Auth Layout -->
	<dialog aria-labelledby="signin_header" class="form_wrapper">
		<form action="/auth" class="form" id="auth_form" method="POST">
			<h1 id="signin_header">Sign In</h1>
			<label for="user_name">Username</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_name_error" class="error"></small>
				<input aria-describedby="user_name_error" autocomplete="username" id="user_name" name="user_name" type="text" />
			</div>
			<label for="user_password">Password</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_password_error" class="error"></small>
				<input aria-describedby="user_password_error" autocomplete="current-password" id="user_password" name="user_password" type="password" />
			</div>
			<button type="submit">Submit</button>
		</form>
	</dialog>
<!-- End Auth Layout -->`;
let fy_layout = `<!-- Start FY Layout -->
	<dialog aria-labelledby="add_fy_header" class="form_wrapper" style="z-index: 2">
		<form class="form" id="fy_form" method="POST">
			<div class="form_header">
				<h1 id="add_fy_header">Add/Edit Financial Year</h1>
				<button onclick="
					fy_form.querySelector('#fy_id').value = '0';
					fy_form.parentNode.close();
					document.querySelector('#fy_menu').querySelector('.toolbar').children[0].focus();
				" type="button">Close</button>
			</div>
			<label for="fy_name">Financial Year</label>
			<input id="fy_id" name="fy_id" type="hidden" value="0" />
			<div class="input_wrapper">
				<small aria-live="assertive" id="fy_name_error" class="error"></small>
				<input aria-describedby="fy_name_error" id="fy_name" name="fy_name" type="text" />
			</div>
			<label for="fy_status">Filter Status</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="fy_status_error" class="error"></small>
				<select aria-describedby="fy_status_error" id="fy_status" name="fy_status">
					<option value="unlocked" selected>unlocked</option>
					<option value="locked">locked</option>
				</select>
			</div>
			<button type="submit">Submit</button>
		</form>
	</dialog>
	<dialog aria-labelledby="filter_fys_header" class="form_wrapper" style="z-index: 2">
		<form class="form" id="fy_filter_form" onsubmit="
			event.preventDefault();
			filter_list(this.querySelectorAll('select'), fy_list);
			this.parentNode.close();
		">
			<div class="form_header">
				<h1 id="filter_fys_header">Filter Financial Years</h1>
				<button onclick="
					this.closest('.form_wrapper').close();
					document.querySelector('#fy_menu').querySelector('.toolbar').children[0].focus();
				" type="button">Close</button>
			</div>
			<label for="filter_status">Filter Status</label>
			<div class="input_wrapper">
				<select id="filter_status" name="status">
					<option selected value="all">all</option>
					<option value="locked">locked</option>
					<option value="unlocked">unlocked</option>
				</select>
			</div>
			<button type="submit">Apply</button>
		</form>
	</dialog>
	<div aria-label="Menu for Financial Year Management" class="menu" id="fy_menu">
		<div class="form_wrapper">
			<form class="horizontal form" id="fy_search_form" onsubmit="event.preventDefault(); search(document.getElementById('search_fy').value, fy_list);">
				<label for="search_fy">Search FY</label>
				<div class="input_wrapper">
					<small aria-live="assertive" class="error" id="search_fy_error"></small>
					<input aria-describedby="search_fy_error" autocomplete="off" id="search_fy" name="fy_name" type="text" />
				</div>
				<button type="submit">Search</button>
			</form>
		</div>
		<div class="list_wrapper">
			<ul aria-label="List of Financial Years" class="list" id="fy_list"></ul>
		</div>
		<div class="toolbar_wrapper"><div aria-label="Toolbar for Financial Year Management" class="toolbar" role="toolbar">
			<button onclick="
				event.stopPropagation();
				fy_form.parentNode.showModal();
			">
				<img alt="" aria-hidden="true" src="icon/add.svg" />
				<span>Add FY</span>
			</button>
			<button id="adminbtn" onclick="window.location.href = '#user_menu'">
				<img alt="" aria-hidden="true" src="icon/admin.svg" />
				<span>Admin</span>
			</button>
			<button onclick="fetch_fy(true, 0)">
				<img alt="" aria-hidden="true" src="icon/export.svg" />
				<span>Export All</span>
			</button>
			<button onclick="
				event.stopPropagation();
				fy_filter_form.parentNode.showModal();
			">
				<img alt="" aria-hidden="true" src="icon/filter.svg" />
				<span>Filter FY</span>
			</button>
			<button onclick="
				document.cookie = 'user_token=; Path=/; Max-Age=0; SameSite=Strict; Secure';
				fy_form.setAttribute('action', '');
				fy_list.innerHTML = '';
				user_form.setAttribute('action', '');
				user_list.innerHTML = '';
				for (let i of document.querySelectorAll('input')) i.value = '';
				for (let i of document.querySelectorAll('select')) i.value = i.children[0].value;
				fy_form.querySelector('#fy_id').value = '0';
				user_form.querySelector('#user_id').value = '0';
				user_status = null;
				user_role = null;
				audition = 0;
				window.location.href = '#auth';
				auth_form.parentNode.showModal();
			">
				<img alt="" aria-hidden="true" src="icon/signout.svg" />
				<span>Sign Out</span>
			</button>
		</div></div>
	</div>
<!-- End FY Layout -->`;
let admin_layout = `<!-- Start Admin Layout -->
	<dialog aria-labelledby="add_user_header" class="form_wrapper" style="z-index: 2">
		<form class="form" id="user_form" method="POST">
			<div class="form_header">
				<h1 id="add_user_header">Add/Edit User</h1>
				<button onclick="
					user_form.querySelector('#user_id').value = '0';
					user_form.parentNode.close();
					document.querySelector('#user_menu').querySelector('.toolbar').children[0].focus();
				" type="button">Close</button>
			</div>
			<input id="user_id" name="user_id" type="hidden" value="0" />
			<label for="admin_user_name">Username</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="username_error" class="error"></small>
				<input aria-describedby="user_name_error" autocomplete="username" id="admin_user_name" name="user_name" type="text" />
			</div>
			<label for="admin_user_password">Password</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_password_error" class="error"></small>
				<input aria-describedby="user_password_error" autocomplete="current-password" id="admin_user_password" name="user_password" type="password" />
			</div>
			<label for="user_role">Role</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_role_error" class="error"></small>
				<select aria-describedby="user_role_error" id="user_role" name="user_role">
					<option selected value="accountant">accountant</option>
					<option value="manager">manager</option>
					<option value="auditor">auditor</option>
				</select>
			</div>
			<label for="user_department">Department</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_department_error" class="error"></small>
				<input aria-describedby="user_department_error" autocomplete="organization" id="user_department" name="user_department" type="text" />
			</div>
			<label for="user_status">Status</label>
			<div class="input_wrapper">
				<small aria-live="assertive" id="user_status_error" class="error"></small>
				<select aria-describedby="user_statys_error" id="user_status" name="user_status">
					<option value="unlocked" selected>unlocked</option>
					<option value="locked">locked</option>
				</select>
			</div>
			<button type="submit">Submit</button>
		</form>
	</dialog>
	<dialog aria-labelledby="filter_users_header" class="form_wrapper" style="z-index: 2">
		<form class="form" id="user_filter_form" onsubmit="
			event.preventDefault();
			filter_list(this.querySelectorAll('select'), user_list);
			this.parentNode.close();
		">
			<div class="form_header">
				<h1 id="filter_users_header">Filter Users</h1>
				<button onclick="
					this.closest('.form_wrapper').close();
					document.querySelector('#user_menu').querySelector('.toolbar').children[0].focus();
				" type="button">Close</button>
			</div>
			<label for="filter_role">Filter Role</label>
			<div class="input_wrapper">
				<select id="filter_role" name="role">
					<option selected value="all">all</option>
					<option value="auditor">auditor</option>
					<option value="manager">manager</option>
					<option value="accountant">accountant</option>
				</select>
			</div>
			<label for="filter_department">Filter Department</label>
			<div class="input_wrapper">
				<select id="filter_department" name="department">
					<option selected value="all">all</option>
				</select>
			</div>
			<label for="filter_status">Filter Status</label>
			<div class="input_wrapper">
				<select id="filter_status" name="status">
					<option selected value="all">all</option>
					<option value="locked">locked</option>
					<option value="unlocked">unlocked</option>
				</select>
			</div>
			<button type="submit">Apply</button>
		</form>
	</dialog>
	<div aria-label="Menu for User Management" id="user_menu" class="menu">
		<div class="form_wrapper">
			<form class="horizontal search form" id="user_search_form" onsubmit="event.preventDefault(); search(document.getElementById('search_username').value, user_list);">
				<label for="search_user">Search User</label>
				<div class="input_wrapper">
					<small aria-live="assertive" class="error" id="search_user_error"></small>
					<input aria-describedby="search_user_error" autocomplete="username" id="search_user" name="user_name" type="text" />
				</div>
				<button type="submit">Search</button>
			</form>
		</div>
		<div class="list_wrapper">
			<ul aria-label="List of Users" class="list" id="user_list"></ul>
		</div>
		<div class="toolbar_wrapper"><div aria-label="Toolbar for User Management" class="toolbar" role="toolbar">
			<button id="crebtn" onclick="
				event.stopPropagation();
				user_form.querySelector('#admin_user_password').value = '';
				user_form.parentNode.showModal();
			">
				<img alt="" aria-hidden="true" src="icon/add.svg" />
				<span>Add User</span>
			</button>
			<button id="expbtn" onclick="export_data()">
				<img alt="" aria-hidden="true" src="icon/export.svg" />
				<span>Export Data</span>
			</button>
			<button onclick="
				event.stopPropagation();
				user_filter_form.parentNode.showModal();
			">
				<img alt="" aria-hidden="true" src="icon/filter.svg" />
				<span>Filter User</span>
			</button>
			<button onclick="
				if (audition && uid != audition) uid = audition;
				fetch_fy();
				window.location.href = '#fy_menu';
			">
				<img alt="" aria-hidden="true" src="icon/home.svg" />
				<span>Home</span>
			</button>
			<input id="importer" style="display: none; visibility: hidden" type="file">
			<button id="impbtn" onclick="import_data()">
				<img alt="" aria-hidden="true" src="icon/import.svg" />
				<span>Import Data</span>
			</button>
		</div></div>
	</div>
<!-- End Admin Layout -->`;
let journal_layout = `<!-- Journal Layout Start -->
	<div aria-label="Journal" class="menu" id="journal">
		<div aria-live="polite" id="journal_action_msg" class="error">Messages will appear hear</div>
		<form class="table_wrapper" id="journal_form" role="presentation">
			<div aria-label="Table: Journal" class="table" role="table">
				<div class="thead" role="rowgroup"><div aria-label="Row: Headers" class="tr" role="row">
					<div class="th" role="columnheader" id="journal_date_head"><span>Date</span></div>
					<div class="th" role="columnheader" id="journal_ac_debited_head"><span>A/c Debited</span></div>
					<div class="th" role="columnheader" id="journal_ac_credited_head"><span>A/c Credited</span></div>
					<div class="th" role="columnheader" id="journal_amount_head"><span>Amount</span></div>
					<div class="th" role="columnheader" id="journal_description_head"><span>Description</span></div>
				</div></div>
				<div class="tbody" id="journal_rows" role="rowgroup"></div>
				<div class="tbody" id="journal_total" role="rowgroup"></div>
			</div>
		</form>
		<div class="toolbar_wrapper"><div aria-label="Toolbar for Journal" class="toolbar" role="toolbar">
			<button onclick="if (status == 'closed') { return; }; add_row()">
				<img alt="" aria-hidden="true"  src="icon/add.svg" />
				<span>Add Row</span>
			</button>
			<button onclick="delete_row(event)">
				<img alt="" aria-hidden="true"  src="icon/delete.svg" />
				<span>Delete Row</span>
			</button>
			<button onclick="export_journal()">
				<img alt="" aria-hidden="true"  src="icon/export.svg" />
				<span>Export Book</span>
			</button>
			<button onclick="
				window.location.href = '#fy_menu';
				fy_id = null;
			">
				<img alt="" aria-hidden="true"  src="icon/home.svg" />
				<span>Home</span>
			</button>
			<input id="importer" style="display: none; visibility: hidden;" type="file">
			<button onclick="import_journal()">
				<img alt="" aria-hidden="true"  src="icon/import.svg" />
				<span>Import Book</span>
			</button>
			<button onclick="window.location.href = '#ledger_menu'">
				<img alt="" aria-hidden="true"  src="icon/menu.svg" />
				<span>Ledger Menu</span>
			</button>
			<button onclick="submit_journal()">
				<img alt="" aria-hidden="true"  src="icon/save.svg" />
				<span>Save Book</span>
			</button>
		</div></div>
	</div>
<!-- Journal Layout End -->`;
let ledger_layout = `<!-- Ledger Layout Start -->
	<div aria-labelledby="filter_ledger_header" class="form_wrapper" style="display: none; z-index: 2">
		<form class="form" id="ledger_filter_form">
			<h1 id="filter_ledger_header">Filter Ledger</h1>
			<div class="input_wrapper">
				<input id="filter_ledger_side" name="side" onclick="event.stopPropagation();this.nextElementSibling.classList.add('visible')" placeholder="side" readonly type="text">
				<ul class="options" onclick="select_option(event, this.previousElementSibling)">
					<li>all</li>
					<li>debit</li>
					<li>credit</li>
					<li>nota</li>
				</ul>
			</div>
			<small class="error"><br></small>
			<div class="input_wrapper">
				<input id="filter_ledger_type" name="type" onclick="event.stopPropagation();this.nextElementSibling.classList.add('visible')" placeholder="type" readonly type="text">
				<ul class="options" onclick="
					select_option(event, this.previousElementSibling);
					if (['nota', '', 'all'].includes(event.target.closest('li').innerText)) {
						document.getElementById('filter_ledger_subtype').value = 'all';
						document.getElementById('filter_ledger_subtype').parentNode.style.display = 'none';
						document.getElementById('filter_ledger_subtype').parentNode.nextElementSibling.style.display = 'none';
						document.getElementById('filter_ledger_operation').value = 'all';
						document.getElementById('filter_ledger_operation').parentNode.style.display = 'none';
						document.getElementById('filter_ledger_operation').parentNode.nextElementSibling.style.display = 'none';
					} else {
						document.getElementById('filter_ledger_subtype').parentNode.style.display = 'flex';
						document.getElementById('filter_ledger_subtype').parentNode.nextElementSibling.style.display = 'flex';
						document.getElementById('filter_ledger_operation').parentNode.style.display = 'flex';
						document.getElementById('filter_ledger_operation').parentNode.nextElementSibling.style.display = 'flex';
					}
					if (event.target.closest('li').innerText == 'liability') document.getElementById('subtype').nextElementSibling.querySelector('li:last-child').style.display='block';
					else document.getElementById('filter_ledger_subtype'.nextElementSibling.querySelector('li:last-child').style.display='none';
				">
					<li>all</li>
					<li>asset</li>
					<li>liability</li>
					<li>nota</li>
				</ul>
			</div>
			<small class="error"><br></small>
			<div class="input_wrapper" style="display: none">
				<input id="filter_ledger_subtype" name="subtype" onclick="event.stopPropagation();this.nextElementSibling.classList.add('visible')" placeholder="subtype" readonly type="text">
				<ul class="options" onclick="select_option(event, this.previousElementSibling)">
					<li>all</li>
					<li>current</li>
					<li>noncurrent</li>
					<li>equity</li>
				</ul>
			</div>
			<small class="error" style="display: none"><br></small>
			<div class="input_wrapper" style="display: none">
				<input id="filter_ledger_operation" name="operation" onclick="event.stopPropagation();this.nextElementSibling.classList.add('visible')" placeholder="operation" readonly type="text">
				<ul class="options" onclick="select_option(event, this.previousElementSibling)">
					<li>all</li>
					<li>add</li>
					<li>less</li>
				</ul>
			</div>
			<small class="error" style="display: none"><br></small>
			<button onclick="filter_list(this.parentNode.querySelectorAll('input'), ledger_list); this.parentNode.parentNode.style.display='none';" type="button">Apply</button>
		</form>
	</div>
	<div aria-label="Menu for Ledger Account Management" class="menu" id="ledger_menu">
		<div class="form_wrapper">
			<form class="horizontal search form" id="ledger_search_form" onsubmit="event.preventDefault(); search(document.getElementById('search_ledger').value, ledger_list);">
				<label for="search_account">Search Account</label>
				<div class="input_wrapper">
					<small aria-live="assertive" class="error" id="search_account_error"></small>
					<input aria-describedby="search_account_error" autocomplete="off" id="search_account" name="account" type="text" />
				</div>
				<button type="submit">Search</button>
			</form>
		</div>
		<div class="list_wrapper">
			<ul aria-label="List of Ledger Accounts" class="list" id="ledger_list"></ul>
		</div>
		<div class="toolbar_wrapper"><div aria-label="Toolbar for Ledger Account Management" class="toolbar" role="toolbar">
			<button onclick="
				window.location.href = '#bs';
			">
				<img alt="" aria-hidden="true" src="icon/book.svg" />
				<span>Balance Sheet</span>
			</button>
			<button onclick="export_all_ledgers()">
				<img alt="" aria-hidden="true" src="icon/export.svg" />
				<span>Export All</span>
			</button>
			<button onclick="
				event.stopPropagation();
				document.getElementById('ledger_filter_form').parentNode.style.display='block';
			" type="button">
				<img alt="" aria-hidden="true" src="icon/filter.svg" />
				<span>Filter Account</span>
			</button>
			<button onclick="window.location.href = '#journal'">
				<img alt="" aria-hidden="true" src="icon/book.svg" />
				<span>Journal</span>
			</button>
			<button onclick="
				window.location.href = '#tb';
			">
				<img alt="" aria-hidden="true" src="icon/book.svg" />
				<span>Trial Balance</span>
			</button>
		</div></div>
	</div>
	<div class="menu" id="ledger_account">
		<div></div>
		<div class="table_wrapper" id="ledger_table">
			<div class="table">
				<div class="thead">
					<div class="tr">
						<div class="th" style="grid-column: span 3"><p>Dr</p></div>
						<div class="th" style="grid-column: span 3"><p>Cr</p></div>
					</div>
					<div class="tr">
						<div class="th"><p>Date</p></div>
						<div class="th"><p>Particulars</p></div>
						<div class="th"><p>Amount</p></div>
						<div class="th"><p>Date</p></div>
						<div class="th"><p>Particulars</p></div>
						<div class="th"><p>Amount</p></div>
					</div>
				</div>
				<div class="tbody"></div>
			</div>
		</div>
		<div class="toolbar_wrapper"><div class="toolbar">
			<button onclick="export_ledger()">
				<img src="icon/export.svg" />
				<small>Export Book</small>
			</button>
			<button onclick="
				window.location.href = '#ledger_menu';
				ledger_table.setAttribute('account', '');
			">
				<img src="icon/menu.svg" />
				<small>Ledger Menu</small>
			</button>
		</div></div>
	</div>
<!-- End Ledger Layout -->`;
let bs_layout = `<!-- Start BS Layout -->
	<div class="menu" id="bs">
		<div></div>
		<div class="table_wrapper" id="bs_table">
			<div class="table">
				<div class="thead">
					<div class="tr">
						<div class="th"><p>Assets</p></div>
						<div class="th"><p>Amount</p></div>
						<div class="th"><p>Liabilities</p></div>
						<div class="th"><p>Amount</p></div>
					</div>
				</div>
				<div class="tbody"></div>
			</div>
		</div>
		<div class="toolbar_wrapper"><div class="toolbar">
			<button onclick="export_bs()">
				<img src="icon/export.svg" />
				<small>Export Book</small>
			</button>
			<button onclick="window.location.href = '#ledger_menu'">
				<img src="icon/menu.svg" />
				<small>Ledger Menu</small>
			</button>
		</div></div>
	</div>
<!-- End BS Layout -->`;
let tb_layout = `<!-- Start TB Layout -->
	<div class="menu" id="tb">
		<div></div>
		<div class="table_wrapper" id="tb_table">
			<div class="table">
				<div class="thead">
					<div class="tr">
						<div class="th"><p>Account</p></div>
						<div class="th"><p>Debit</p></div>
						<div class="th"><p>Credit</p></div>
					</div>
				</div>
				<div class="tbody"></div>
			</div>
		</div>
		<div class="toolbar_wrapper"><div class="toolbar">
			<button onclick="export_tb()">
				<img src="icon/export.svg" />
				<small>Export Book</small>
			</button>
			<button onclick="
				window.location.href = '#ledger_menu';
				ledger_table.setAttribute('account', '');
			">
				<img src="icon/menu.svg" />
				<small>Ledger Menu</small>
			</button>
		</div></div>
	</div>
<!-- End TB Layout -->`;
document.body.insertAdjacentHTML("beforeend", page_load_layout);
document.body.insertAdjacentHTML("beforeend", auth_layout);
document.body.insertAdjacentHTML("beforeend", fy_layout);
document.body.insertAdjacentHTML("beforeend", admin_layout);
document.body.insertAdjacentHTML("beforeend", journal_layout);
document.body.insertAdjacentHTML("beforeend", ledger_layout);
document.body.insertAdjacentHTML("beforeend", bs_layout);
document.body.insertAdjacentHTML("beforeend", tb_layout);