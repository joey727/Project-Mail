document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // By default, load the inbox
  load_mailbox('inbox');

  // send mail
  document.querySelector('#compose-form').addEventListener('submit', event => {
    event.preventDefault();
    submit_mail();
  });
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // display mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><div id="emails"><div>`;

  // Get the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    const emails_div = document.querySelector('#emails')
    emails.forEach(email => {
      backgroud = email.read ? 'bg-light' : 'white';
      div = document.createElement('div');
      div.innerHTML = `<strong class="pr-2">${email.sender}</strong> ${email.subject} <span class="ml-auto">${email.timestamp}</span>`;
      div.classList.add('border', 'p-2', 'd-flex', backgroud);
      div.addEventListener('click', () => {
        load_email(email, mailbox);
      })
      emails_div.append(div);
    });

    // for when mailbox is empty
    if (emails.length === 0) {
      div = document.createElement('div');
      div.innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)} is empty!`;
      div.classList.add('border', 'p-2', 'text-center', 'bg-light');
      emails_div.append(div);
    }
  })
  .catch(error => {
    console.log('Error:', error);
  });
}


function load_email(email, mailbox) {
  
  // show only the mail and hide the other views
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  const email_view = document.querySelector('#email-view');

  // view mail
  fetch(`/emails/${email.id}`)
  .then(response => response.json())
  .then(email => {

    archive = email.archived ? "Unarchive" : "Archive";
    email_view.innerHTML = `
      <div><strong>From:</strong> <span>${email.sender}</span><div>
      <div><strong>To:</strong> <span>${email.recipients}</span><div>
      <div><strong>Subject:</strong> <span>${email.subject}</span><div>
      <div><strong>Timestamp:</strong> <span>${email.timestamp}</span><div>
      <button class="btn btn-sm btn-outline-primary mt-2" id="reply" onclick="reply('${email.id}');">Reply</button>
      <button class="btn btn-sm btn-outline-primary mt-2" id="archive" onclick="archive_email(${email.id}, ${email.archived});">${archive}</button>
      <hr>
      <div>${email.body}</div>
    `;

    // archive button should not show in emails from sent mailbox
    if (document.querySelector('#user-email').innerHTML === email.sender) {
      document.querySelector('#archive').remove()
    }

    // mark a mail as read
    if (mailbox === 'inbox') {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true 
        })
      })
    }
  })
  .catch(error => {
    console.log('Error:', error)
  });
}

function reply(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    compose_email();
    
    document.querySelector('#compose-recipients').value = email['sender'];
    document.querySelector('#compose-body').value = `On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}`;
    
    // checking for the subject
    if (email['subject'].search('Re: ')) {
      document.querySelector('#compose-subject').value = email['subject'];
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
    }

  })

  .catch(error => {
    console.log(error)
  });
}

function archive_email(id, archived) {
  // change to archived
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived 
    })
  })
  .then(() => {
    load_mailbox('inbox');
  })
  .catch(error => {
    consolog.log(error)
  });
}

function submit_mail() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  })
}