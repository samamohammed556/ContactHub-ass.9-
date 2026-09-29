var contactNameInput = document.getElementById('contactName');
var contactPhoneInput = document.getElementById('contactPhone');
var contactEmailInput = document.getElementById('contactEmail');
var contactAddressInput = document.getElementById('contactAddress');
var contactGroupInput = document.getElementById('contactGroup');
var contactNotesInput = document.getElementById('contactNotes');
var contactFavoriteInput = document.getElementById('contactFavorite');
var contactEmergencyInput = document.getElementById('contactEmergency');
var avatarInput = document.getElementById('avatarInput');
var avatarPreview = document.getElementById('avatarPreview');
var contactForm = document.getElementById('contactForm');
var modalTitle = document.getElementById('modalTitle');
var submitBtn = document.getElementById('submitBtn');
var addContactBtn = document.getElementById('addContactBtn');
var searchInput = document.getElementById('searchInput');
var contactsGrid = document.getElementById('contactsGrid');
var emptyState = document.getElementById('emptyState');
var statTotal = document.getElementById('statTotal');
var statFav = document.getElementById('statFav');
var statEmg = document.getElementById('statEmg');
var contactsSubtitle = document.getElementById('contactsSubtitle');
var favList = document.getElementById('favList');
var emgList = document.getElementById('emgList');
var contactModalEl = document.getElementById('contactModal');
var contactModal = new bootstrap.Modal(contactModalEl);
var nameRegex = /^[A-Za-z\u0621-\u064A\s]{2,50}$/;
var phoneRegex = /^01[0125][0-9]{8}$/;
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

var contactsList;
if (localStorage.getItem('contacts') != null) {
    contactsList = JSON.parse(localStorage.getItem('contacts'));
} else {
    contactsList = [];
}

var pendingAvatar = "";
var savedIndex = null;

var GROUP_LABELS = { family: "Family", friends: "Friends", work: "Work", school: "School", other: "Other" };


var AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #F9A8D4, #93C5FD)', // pink -> blue (lighter)
    'linear-gradient(135deg, #93C5FD, #C4B5FD)', // blue -> purple (lighter)
    'linear-gradient(135deg, #C4B5FD, #F9A8D4)', // purple -> pink (lighter)
    'linear-gradient(135deg, #FCD34D, #F9A8D4)', // amber -> pink (lighter)
    'linear-gradient(135deg, #A5B4FC, #F9A8D4)', // indigo -> pink (lighter)
    'linear-gradient(135deg, #F9A8D4, #C4B5FD)'  // pink -> purple (lighter)
];

function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function initials(name) {
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function colorFor(name) {
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function avatarInner(contact) {
    if (contact.image) {
        return '<img src="' + contact.image + '" alt="' + escapeHTML(contact.name) + '">';
    }
    return initials(contact.name);
}

function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contactsList));
}

function clearFieldErrors() {
    contactNameInput.classList.remove('is-invalid');
    contactPhoneInput.classList.remove('is-invalid');
    contactEmailInput.classList.remove('is-invalid');
}

function validateForm() {
    var isValid = true;

    if (!nameRegex.test(contactNameInput.value.trim())) {
        contactNameInput.classList.add('is-invalid');
        isValid = false;
    }
    if (!phoneRegex.test(contactPhoneInput.value.trim())) {
        contactPhoneInput.classList.add('is-invalid');
        isValid = false;
    }
    var emailVal = contactEmailInput.value.trim();
    if (emailVal !== '' && !emailRegex.test(emailVal)) {
        contactEmailInput.classList.add('is-invalid');
        isValid = false;
    }

    return isValid;
}

function findDuplicateIndex(phone, excludeIndex) {
    for (var i = 0; i < contactsList.length; i++) {
        if (i === excludeIndex) continue;
        if (contactsList[i].phone === phone) return i;
    }
    return -1;
}

function updateStats() {
    statTotal.textContent = contactsList.length;
    statFav.textContent = contactsList.filter(function (c) { return c.favorite; }).length;
    statEmg.textContent = contactsList.filter(function (c) { return c.emergency; }).length;
    contactsSubtitle.textContent =
        'Manage and organize your ' + contactsList.length + ' contact' + (contactsList.length === 1 ? '' : 's');
}


function contactCardHTML(c, realIndex) {
    var groupLabel = GROUP_LABELS[c.group] || 'Other';

    var favBadge = c.favorite ? '<span class="badge-fav"><i class="fa-solid fa-star"></i></span>' : '';
    var emgBadge = c.emergency ? '<span class="badge-emg"><i class="fa-solid fa-heart-pulse"></i></span>' : '';

    var starIconClass = c.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star';

    var emailLine = c.email
        ? '<p class="contact-line mb-0"><span class="line-icon bg-purple-soft"><i class="fa-solid fa-envelope"></i></span><span class="text-truncate flex-grow-1">' + escapeHTML(c.email) + '</span></p>'
        : '';
    var addressLine = c.address
        ? '<p class="contact-line mb-0"><span class="line-icon bg-green-soft"><i class="fa-solid fa-location-dot"></i></span><span class="text-truncate flex-grow-1">' + escapeHTML(c.address) + '</span></p>'
        : '';
    var extraLines = (emailLine || addressLine)
        ? '<div class="contact-extra-lines">' + emailLine + addressLine + '</div>'
        : '';
    var emergencyTag = c.emergency
        ? '<span class="emergency-badge"><i class="fa-solid fa-heart-pulse me-1"></i>Emergency</span>'
        : '';
    var mailBtn = c.email
        ? '<a href="mailto:' + encodeURIComponent(c.email) + '" class="card-icon-btn action-mail" title="Email"><i class="fa-solid fa-envelope"></i></a>'
        : '';

    return (
        '<div class="col">' +
            '<div class="contact-card' + (c.favorite ? ' is-favorite' : '') + '">' +
                '<div class="d-flex gap-3 align-items-center">' +
                    '<div class="avatar-wrap">' +
                        '<div class="contact-avatar" style="background:' + colorFor(c.name) + '">' + avatarInner(c) + '</div>' +
                        favBadge + emgBadge +
                    '</div>' +
                    '<div class="flex-grow-1 min-w-0">' +
                        '<p class="contact-name mb-1 text-truncate">' + escapeHTML(c.name) + '</p>' +
                        '<p class="contact-line mb-0"><span class="line-icon bg-blue-soft"><i class="fa-solid fa-phone"></i></span><span class="text-truncate flex-grow-1">' + escapeHTML(c.phone) + '</span></p>' +
                    '</div>' +
                '</div>' +
                extraLines +
                '<div class="d-flex flex-wrap gap-1 mt-2">' +
                    '<span class="group-badge">' + groupLabel + '</span>' +
                    emergencyTag +
                '</div>' +
                '<div class="contact-actions">' +
                    '<a href="tel:' + escapeHTML(c.phone) + '" class="card-icon-btn action-call" title="Call"><i class="fa-solid fa-phone"></i></a>' +
                    mailBtn +
                    '<div class="ms-auto d-flex gap-2">' +
                        '<button type="button" class="card-icon-btn toggle-fav ' + (c.favorite ? 'active-fav' : '') + '" onclick="toggleFavorite(' + realIndex + ')" title="Favorite"><i class="' + starIconClass + '"></i></button>' +
                        '<button type="button" class="card-icon-btn toggle-emg ' + (c.emergency ? 'active-emg' : '') + '" onclick="toggleEmergency(' + realIndex + ')" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></button>' +
                        '<button type="button" class="card-icon-btn toggle-edit" onclick="setFormForUpdate(' + realIndex + ')" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
                        '<button type="button" class="card-icon-btn toggle-delete" onclick="deleteContact(' + realIndex + ')" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
}


function displayContacts(arr) {
    if (arr.length === 0) {
        contactsGrid.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }
    emptyState.classList.add('d-none');
    var cartoona = '';
    for (var i = 0; i < arr.length; i++) {
        var realIndex = contactsList.indexOf(arr[i]);
        cartoona += contactCardHTML(arr[i], realIndex);
    }
    contactsGrid.innerHTML = cartoona;
}


function miniRowHTML(c, kind) {
    var rowKindClass = kind === 'emg' ? 'mini-row-emg' : 'mini-row-fav';
    var callKindClass = kind === 'emg' ? 'mini-call-emg' : 'mini-call-fav';
    return (
        '<div class="mini-row ' + rowKindClass + '">' +
            '<div class="mini-avatar" style="background:' + colorFor(c.name) + '">' + avatarInner(c) + '</div>' +
            '<div class="min-w-0 flex-grow-1">' +
                '<p class="mini-name mb-0 text-truncate">' + escapeHTML(c.name) + '</p>' +
                '<p class="mini-sub mb-0 text-truncate">' + escapeHTML(c.phone) + '</p>' +
            '</div>' +
            '<a href="tel:' + escapeHTML(c.phone) + '" class="mini-call ' + callKindClass + ' card-icon-btn" title="Call"><i class="fa-solid fa-phone"></i></a>' +
        '</div>'
    );
}

function displaySideLists() {
    var favs = contactsList.filter(function (c) { return c.favorite; });
    var emgs = contactsList.filter(function (c) { return c.emergency; });

    favList.innerHTML = favs.length
        ? favs.map(function (c) { return miniRowHTML(c, 'fav'); }).join('')
        : '<p class="empty-note mb-0">No favorites yet</p>';
    emgList.innerHTML = emgs.length
        ? emgs.map(function (c) { return miniRowHTML(c, 'emg'); }).join('')
        : '<p class="empty-note mb-0">No emergency contacts</p>';
}

function refreshUI(arr) {
    updateStats();
    displayContacts(arr || contactsList);
    displaySideLists();
}


avatarInput.addEventListener('change', function () {
    var file = avatarInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        pendingAvatar = e.target.result;
        avatarPreview.innerHTML = '<img src="' + pendingAvatar + '" alt="preview">';
    };
    reader.readAsDataURL(file);
});

function clearForm() {
    contactNameInput.value = null;
    contactPhoneInput.value = null;
    contactEmailInput.value = null;
    contactAddressInput.value = null;
    contactGroupInput.value = null;
    contactNotesInput.value = null;
    contactFavoriteInput.checked = false;
    contactEmergencyInput.checked = false;
    avatarInput.value = null;

    clearFieldErrors();
    avatarPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
    pendingAvatar = '';
    savedIndex = null;
}

function addContact() {
    if (!validateForm()) return;

    var trimmedPhone = contactPhoneInput.value.trim();

    // don't save a phone number that's already saved for another contact
    if (findDuplicateIndex(trimmedPhone, null) !== -1) {
        Swal.fire({
            title: 'Already Saved',
            text: 'A contact with this phone number already exists.',
            icon: 'info',
            confirmButtonColor: '#7C3AED'
        });
        return;
    }

    var contact = {
        name: contactNameInput.value.trim(),
        phone: trimmedPhone,
        email: contactEmailInput.value.trim(),
        address: contactAddressInput.value.trim(),
        group: contactGroupInput.value || 'other',
        notes: contactNotesInput.value.trim(),
        favorite: contactFavoriteInput.checked,
        emergency: contactEmergencyInput.checked,
        image: pendingAvatar
    };

    contactsList.push(contact);
    saveContacts();
    refreshUI();
    clearForm();
    contactModal.hide();

    Swal.fire({
        title: 'Saved!',
        text: contact.name + ' was added to your contacts.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false
    });
}

function setFormForUpdate(index) {
    var c = contactsList[index];
    if (!c) return;

    clearForm();
    savedIndex = index;

    contactNameInput.value = c.name;
    contactPhoneInput.value = c.phone;
    contactEmailInput.value = c.email;
    contactAddressInput.value = c.address;
    contactGroupInput.value = c.group;
    contactNotesInput.value = c.notes;
    contactFavoriteInput.checked = !!c.favorite;
    contactEmergencyInput.checked = !!c.emergency;

    if (c.image) {
        pendingAvatar = c.image;
        avatarPreview.innerHTML = '<img src="' + c.image + '" alt="preview">';
    }

    modalTitle.textContent = 'Edit Contact';
    contactModal.show();
}

function updateContact() {
    if (!validateForm()) return;

    var trimmedPhone = contactPhoneInput.value.trim();

    // same duplicate guard, but ignore this contact's own current record
    var dupIndex = findDuplicateIndex(trimmedPhone, savedIndex);
    if (dupIndex !== -1) {
        Swal.fire({
            title: 'Already Saved',
            text: 'Another contact already uses this phone number.',
            icon: 'info',
            confirmButtonColor: '#7C3AED'
        });
        return;
    }

    var c = contactsList[savedIndex];
    c.name = contactNameInput.value.trim();
    c.phone = trimmedPhone;
    c.email = contactEmailInput.value.trim();
    c.address = contactAddressInput.value.trim();
    c.group = contactGroupInput.value || 'other';
    c.notes = contactNotesInput.value.trim();
    c.favorite = contactFavoriteInput.checked;
    c.emergency = contactEmergencyInput.checked;
    if (pendingAvatar) c.image = pendingAvatar;

    saveContacts();
    refreshUI();
    clearForm();
    contactModal.hide();

    Swal.fire({
        title: 'Updated!',
        text: c.name + "'s contact details were updated.",
        icon: 'success',
        timer: 1400,
        showConfirmButton: false
    });
}


contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (savedIndex === null) {
        addContact();
    } else {
        updateContact();
    }
});

addContactBtn.addEventListener('click', function () {
    clearForm();
    modalTitle.textContent = 'Add New Contact';
    contactModal.show();
});


function deleteContact(index) {
    var c = contactsList[index];
    if (!c) return;

    Swal.fire({
        title: 'Delete Contact?',
        text: 'Are you sure you want to delete ' + c.name + '? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        reverseButtons: true
    }).then(function (result) {
        if (result.isConfirmed) {
            contactsList.splice(index, 1);
            saveContacts();
            refreshUI();
            Swal.fire({
                title: 'Deleted!',
                text: c.name + ' has been removed.',
                icon: 'success',
                timer: 1300,
                showConfirmButton: false
            });
        }
    });
}


function toggleFavorite(index) {
    contactsList[index].favorite = !contactsList[index].favorite;
    saveContacts();
    refreshUI();
}

function toggleEmergency(index) {
    contactsList[index].emergency = !contactsList[index].emergency;
    saveContacts();
    refreshUI();
}

searchInput.addEventListener('input', function () {
    var term = searchInput.value.toUpperCase();
    if (term === '') {
        displayContacts(contactsList);
        return;
    }
    var result = [];
    for (var i = 0; i < contactsList.length; i++) {
        var c = contactsList[i];
        if (
            c.name.toUpperCase().includes(term) ||
            c.phone.toUpperCase().includes(term) ||
            (c.email || '').toUpperCase().includes(term)
        ) {
            result.push(c);
        }
    }
    displayContacts(result);
});

refreshUI();