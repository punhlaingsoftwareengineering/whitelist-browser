# Dora (SaaS)

A browser-embedded application where an admin can choose which websites are allowed, with optional proxy settings. Positioned as SaaS for other organizations.

## Folder Structure

> `dora-desktop` — SvelteKit + Tauri desktop client (product name: **Dora**)
> `dora-server` — Admin dashboard for device requests, access, proxy, and allowed sites (product name: **Dora**)

## Dependencies

> daisyui (default: cupcake theme), uuid, zod, d3, @lucide/svelte, nodemailer, ws, multer, @icons-pack/svelte-simple-icons

## UI

make sure every ui component is daisyui components, only in edge cases use own tailwind raw, every icon should be from lucide, simple icons, all the data transfer json in anywhere should be casted by custom create ZodSchema.

## Data Flow

1. create schema, type, relation of each table in server db folder categorizing into auth, master, main, enum, and so on. also each table name should have prefix relevent to their groups (eg. auth_user, master_status, main_device, enum_type). master tables are not be allowed to create, update, delete. the data will be seed into with scripts using drzzile seed. enum  

2. after that use sveltekit remote functions to create crud function for each table. all remote function should have .refresh().

3. then in +server.ts call the remote function.

4. then in +page.svelte or +layout.svelte called that api +server.ts.

## Config

1. tables -> (id = uuidv7, created_at, updated_at, master_status_id, others...)
2. delete -> (confrimation dialog always retype the thing user trying to delete)

## Server (run on 5173)

### Pages (routes)

#### (public)/onboarding

create `onboarding` page, which is the entry page to the site. explain a little bit about the project, there will be navbar, footer bar, hero section. in the navbar there will be app name on the left, pages listed in the center, theme pallete icon, login button, sign up button on the right. 

#### (public)/auth/login

Login page should have card, formfield using, return button(which go back to the previous page), home button(which go back to the home page), social sign in button(google and github), form with email and password also, and the link such as do not have account signup link and forgot passowrd link.

#### (public)/auth/signup

Mostly the same as Login page, but it will have the name field and confirm field extra, if email and password is the form of user choice, make sure otp send to that mail, use google smtp to send, and able to enter otp code.

OTP code verification is mandatory if not do not even save the information in the database.

#### (public)/auth/forget-password

enter mail, then send forget password form with new password, and confirm passord.

#### (private)/home

when auth success go to home, in home, i can create organization and see the list, 

after create and appear in the table, there will be enter button, edit icon button and delete icon on each row, edit appear the same dialog when create but with the selected data.

When enter it will go to (private)/home/{uuidv7}

#### (private)/home/{uuidv7}

when got to this there will be alot to setup and configure, first is ability setup proxy host and port, available websites, and account request (they all can be null).

proxy information and available websites are just crud, when account request, when desktop request to the server socket listen (also http) then, appear auto. user can approve, reject, and ignore. when accept user must give the device name, and save the device info(this will be send from desktop). 

after accept system track the device information every time the desktop app is using.

when creating organization, user can generate organization name and secret key, they are not fixes, change everytime, so latest is valid like authenticator applications, desktop app will need to put those two info to request connect. 

if accepted organization going to give those informations to the desktop back.

#### api/**

all the api go here

## Desktop (run on 5174)

a static sveltekit with tauri 

#### (routes)

#### (public)/auth/connect

this will have to connect with organization name and secret key. when correct save that info to device key storage. and also enter and log in when application start next time, no need to connect multiple time if correct. 

if correct the device request successful and then wait for approval from the user from server web. only then go to home page.

#### (private)

if that organization has proxy setting setup, get those info and set up in embed browser, and only show available websites. user will be able to access those webpages with the organizations setting.
