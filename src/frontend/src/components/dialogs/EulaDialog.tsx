import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface EulaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

interface EulaAcceptResponse {
  success: boolean;
}

const EulaDialog: React.FC<EulaDialogProps> = ({ isOpen, onClose, onAccept, commonAPIRequest }) => {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!accepted || !commonAPIRequest) return;

    setIsSubmitting(true);
    const endpoint = API_ENDPOINTS.auth.validateEula; // Add this endpoint to your config

    commonAPIRequest<EulaAcceptResponse>(
      {
        api: createEndpointUrl(endpoint),
        method: endpoint.method,
        data: {
          accepted: true,
        },
      },
      (response) => {
        setIsSubmitting(false);
        console.log('sss-response', response);

        if (response?.accepted) {
          onAccept();
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">End User License Agreement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow mt-4 rounded-md border bg-muted/30 p-4">
          <div className="text-sm leading-6 space-y-4">
            <section className="space-y-2">
              <p>
                End User License Agreement This Master Subscription Agreement (hereinafter,
                “Agreement”) contains the terms and conditions upon which Open ASPM Project LLP
                (“Open ASPM Project LLP”, “we”, “us” or “our”) and provide our subscribers with
                access to and use of (i) Open ASPM Project LLP Application Security Platform,
                tools and services accessible via our Website/Site (the “Platform”), (ii)
                Configuration, setup services, (iii) Customer interface channels. This Agreement
                constitutes a legally binding contract on You (being a person or legal entity
                identified as the Administrator of an account with Appsec Platform) and
                governs the use of and access to the Services by You, your Agents, and other
                authorized personnel whether in connection with a free, paid or trial subscription
                of the Platform. Please read this Agreement carefully as it contains important
                information about your legal rights, remedies, and obligations. By accepting this
                Agreement, either by signing up for a Firewall Appsec Platform account or accessing
                and using any of the Services or permitting any Agent to access or use a Service,
                You agree to be bound by this Agreement. If you are signing up as a company,
                organization or any other legal entity (“Entity”), you are agreeing to this
                agreement for that Entity and representing to Open ASPM Project LLP that you
                have the authority to enter into this Agreement and bind such entity and its
                affiliates to this Agreement. If you do not agree to this Agreement, then you may
                not access or use any of the Services. Open ASPM Project LLP does not contract
                with minors. By accepting this Agreement, You confirm that You are a natural person
                and major of age (according to the local laws) and competent to enter into a valid
                and binding contract and you warrant that you possess the legal authority to create
                a binding legal obligation. Any new features that augment or enhance the current
                Service, including the release of new tools and resources, shall be subject to this
                Agreement. Definitions Account or Your Account means the Account maintained by your
                Entity on the Platform. Account Information means certain information and details,
                including name, e-mail id, and any other information deemed necessary by NGFW
                Security Services LLP to maintain an Account with the Platform. Administrator means
                the person within the Entity who has authority to give access to other users
                (Subusers) of the Platform. Services means the Application Security Services
                provided to You through the tools and functionalities of the Platform. Sub user
                means all users within the Entity that the Administrator gives access to the
                Platform through Your Account. Term means the term of this Agreement beginning from
                the date on which You have signified Your acceptance to the same. Your Data means
                all data that You upload to the Platform or fetch from the accounts that You
                maintain with the Platform. Your Data also includes information generated through
                the Platform by using the Platform’s tools and functionalities. Scope of Use and
                Access to the Platform On completion of Your subscription and registration process,
                Open ASPM Project LLP hereby gives You the right to access to the use of
                Platform (including all tools and services) and the Services in accordance with the
                terms of this Master Subscription Agreement. The permission to access and use the
                Platform and Services is a limited one and in adherence to this Agreement only. NGFW
                Security Services LLP reserves all rights in its name, trademarks, copyrights and
                other intellectual property. You shall not maintain more than one Account for your
                organization/business entity. Every organization is permitted to use and maintain
                only a single Account. You may access the Platform and Services using a single user
                Account via multiple access points or as multiple user/accounts as per the plan
                chosen by you. You may allow Your employees (Subusers) to access the Platform via
                Your Account on Your behalf. You shall ensure that Your Account is used by personnel
                only from Your organization or authorized by your organization to access such
                accounts. You agree not to provide any access to Your Account to any third-party
                vendors without Open ASPM Project LLP’s approval You shall not use our Services
                for any unauthorized, illegal or fraudulent purpose nor shall You violate any laws
                application to Your jurisdiction. You shall not modify, adapt or hack the Service or
                modify another website so as to falsely imply that it is associated with NGFW
                Security Services LLP. You shall not resell the Service to any third party as a
                private label or with the inclusion of a mark-up fee without our expressed written
                consent. Open ASPM Project LLP reserves the right to make changes to the
                functionality or the documentation of the Platform and the provision of Services
                from time to time. Open ASPM Project LLP shall perform all necessary server
                management and maintenance services with respect to the Platform at no additional
                cost to You. Open ASPM Project LLP does not guarantee availability of the
                Platform at all times. Open ASPM Project LLP shall use reasonable efforts to
                make the Services available to You, at all times through the Platform. However, as
                the Services are provided over the Internet, data and cellular networks, the quality
                and availability of the same may be affected by factors outside OpenASPM
                Services LLP’s control. Therefore, Open ASPM Project LLP shall not be liable
                for non-availability of the Services at any time. Open ASPM Project LLP may try
                and restore access to the Platform and Services on a best reasonable and
                commercially viable basis. Registration and Subscription In order to access and use
                the Platform, You will be required to complete the registration process and maintain
                a Open ASPM Project LLP account (“Account”) which will require You to furnish
                Account Information to Open ASPM Project LLP. You agree to keep this
                information updated at all times. Upon completing the registration process, You
                shall be entitled to access the Platform and avail of the Services. You shall be
                responsible for maintaining the confidentiality and security of the password and for
                all activities that occur in and through Your Account. Open ASPM Project LLP
                and its affiliates / partners are not liable for any harm caused by, or related to
                the theft of or disclosure of Your Account Information, or Your authorization to
                allow another person to access and use the Service using Your Account. You agree to
                abide by the following measures for registering and maintaining the security of Your
                Account. You shall not provide any false, inaccurate or misleading information to
                Open ASPM Project LLP. You shall ensure that the Account Information is
                complete, accurate and up-to-date at all times. Your account, ID, and password may
                not be transferred or sold to another party. You agree to immediately notify NGFW
                Security Services LLP of any actual or suspected theft, loss or unauthorized use of
                Your account, password or any other breach of security known to You. In case of any
                failure by you to notify Open ASPM Project LLP, You may be liable to NGFW
                Security Services LLP and its affiliates / partners for the losses caused to them
                due to such unauthorized use. In order to ensure that Open ASPM Project LLP is
                able to provide high quality services, respond to customer needs, and comply with
                laws, You hereby consent to let Open ASPM Project LLP’s employees and agents
                access Your Account and records on a case-to-case basis to investigate complaints or
                other allegations or suspected abuse. Additionally, You agree to disclose to NGFW
                Security Services LLP, and permit Open ASPM Project LLP to use, Your log-in ID,
                and such other account details with respect to Your account(s), for the limited
                purpose of resolving technical problems. You are entirely responsible for any
                data/content that you enter into the Platform such as Asset Configuration, User
                Management and related Inputs (Your Data). You are also responsible for all the
                activity that occurs through or within Your Account, including activities of the
                Subusers. Any abusive, fraudulent or unauthorized use of the Services will warrant
                termination of Your right to access and use the Services, including other remedies
                that Open ASPM Project LLP may have by laws in force. You are fully liable for
                any fraudulent, abusive or illegal activity or data storage that occurs through Your
                Account. Acceptable Usage of the Platform and Adherence to Laws You agree to use the
                Services solely for the purpose for which the Services are provided, namely as
                Secret Scanning, Software Composition Analysis, Vulnerability Management, API
                Scanning and Infrastructure monitoring whichever is applicable as per the
                PO/agreement, and solely to aid Your business. You shall not sublicense or resell
                the Platform or the Services for the use or benefit of any other organization,
                entity, business or enterprise. Open ASPM Project LLP prohibits the following
                uses of the Platform: You agree not to submit or upload to the Platform, any
                material that is illegal, misleading, defamatory, indecent or obscene, threatening,
                infringing any third- party proprietary rights, invasive of personal privacy or
                otherwise objectionable (collectively, “Objectionable Matter”). OpenASPM
                Services LLP reserves the right to adopt and amend rules for the permissible use of
                the Platform and the Services at any time, and You shall be required to comply with
                such rules. You shall also be required to comply with all applicable laws regarding
                privacy, data storage etc., or any other policy of Open ASPM Project LLP, as
                updated from time to time. Open ASPM Project LLP reserves the right to
                terminate this Agreement and Your access to the Platform, without notice, if You
                commit any breach of this clause. You shall not use the Platform for any unlawful
                purposes or in furtherance of illegal activities. You shall not use the Platform for
                blackmail, extortion, or for otherwise inappropriate purposes or to improperly
                access or view obscene, pornographic, or otherwise sexually explicit material. You
                shall not alter, resell or sublicense the Platform or the Services to any third
                party. You shall not reverse engineer the Platform or its software or other
                technology, circumvent, disable or otherwise interfere with security-related
                features or any digital rights management mechanisms of the Platform. You will not
                use the Platform or the Service to (i) build a competitive product or service, (ii)
                make or have a product with similar ideas, features, functions or graphics of the
                Platform, (iii) make derivative works based on the Platform / Services; or (iv) copy
                any features, functions or graphics of the Platform/Services. You shall not post or
                transmit, or cause to be posted or transmitted, any communication or solicitation
                designed or intended to obtain password and account information from any other
                user/subscriber of the Platform. Open ASPM Project LLP reserves the right to
                post advertisements on the platform. You shall not use the Platform or Services for
                causing any physical or financial harm to any other individual or entity. This
                includes, but is not limited to, facilitating unauthorized access to protected
                systems, or damaging infrastructure. Fees and Payments All amounts associated with
                the Your Account are due in full and payable in advance (in the beginning of the
                Term) or as agreed upon. All such amounts are based on the Plan chosen by You/as
                mutually agreed upon between You and Open ASPM Project LLP. Payment Methods:
                Fees may be paid by the You through various methods of payment provided for by NGFW
                Security Services LLP through its Services. You are responsible for providing
                complete and accurate billing and contact information to Open ASPM Project LLP
                and notifying of any changes to such information. Open ASPM Project LLP may
                modify the Fee by giving a prior notice of thirty (30) days. In the event of an
                upgrade or opting for additional Services, the new Fee will take effect immediately
                and be pro-rated for the rest of the month if paying monthly, and if prepaid for
                annual, the pro-ration will happen until the end of the term of the Billing Cycle.
                Unless otherwise agreed by the parties, Services will be billed in advance on a
                monthly, six monthly or annual basis, starting on the first payment. You shall
                ensure timely payment of the Fee. In case the You fail to pay the fee for a period
                of two Billing Cycles, Open ASPM Project LLP reserves the right to terminate
                this Agreement. Unless otherwise agreed upon, invoiced charges are due net 30 days
                from the invoice date. Any overdue payment shall accrue interest at the maximum rate
                permitted by law on the outstanding balance per month from the date on which such
                amount becomes due until the date paid. In case any payment is overdue for 30 days
                or more, Open ASPM Project LLP reserves the right to suspend your access to the
                account and/or downgrade the Services until the payment is made. In addition, NGFW
                Security Services LLP may condition future subscription renewals on shorter Billing
                Cycles. Refunds: All Fees paid are non-refundable unless otherwise agreed upon. You
                acknowledge and agree that no refunds shall be paid on account of opting out,
                cancellation, non-use or partial use of the Services. Taxes: All amounts mentioned
                are exclusive of GST and other taxes. You are responsible for paying all the
                applicable taxes. Open ASPM Project LLP shall, if it has the legal obligation
                to do so, include such amounts in the invoice. In case Open ASPM Project LLP
                pays any taxes or duties on Your behalf, You agree to reimburse OpenASPM
                Services LLP for any such payment. Opting Out and Termination This Agreement shall
                commence on the date agreed upon between You and Open ASPM Project LLP and will
                remain in effect until suspended or terminated in accordance with this Agreement.
                All terms and conditions in this Agreement shall begin and be in force (except the
                obligations pertaining to Confidentiality, Intellectual Property Rights and
                Indemnity) till the expiration of the Term upon cancellation of your registration.
                You may terminate Your registration by sending an email to your Point of Contact at
                Open ASPM Project LLP., if You no longer wish to use the Platform. Upon
                termination, You will cease to have access to the Platform or any of the Services.
                Open ASPM Project LLP is under no obligation to provide Your Data to you once
                you have terminated the Services and your access to the Platform revoked. NGFW
                Security Services LLP reserves the right to suspend or terminate Your Account or
                restrict or prohibit You access to the Platform immediately (a) if OpenASPM
                Services LLP is unable to verify or authenticate Your registration data, email
                address or other information provided by You, (b) if Open ASPM Project LLP
                believes that Your actions may cause legal liability for You or for OpenASPM
                Services LLP, or all or some of Open ASPM Project LLP's other users, or (c) if
                Open ASPM Project LLP believes You have provided false or misleading
                registration data or other information, have not updated Your Account Information,
                have interfered with other users or the administration of the Services, or have
                violated this Agreement or the Privacy Policy. You shall not be entitled to access
                the Platform or avail the Services if Your Account has been temporarily or
                indefinitely suspended or terminated by Open ASPM Project LLP for any reason
                whatsoever. Open ASPM Project LLP may, at any time, reinstate any suspended
                Account, without assigning any reasons. If Your Account has been indefinitely
                suspended You shall not be allowed to re-register or attempt to register another
                account with Open ASPM Project LLP or its affiliates / partners or use Platform
                or the Services in any manner whatsoever until such time that You are reinstated by
                Open ASPM Project LLP. Upon termination of this Agreement, Your right to access
                the Platform and use the Services shall immediately cease and You shall not be
                allowed to access Your Data in any form. Thereafter, You shall have no right, and
                Open ASPM Project LLP shall have no obligation thereafter, to execute any of
                uncompleted tasks. Open ASPM Project LLP follows a no refund policy and
                therefore, no refund of the Fees shall be provided under any circumstances. Once the
                Services are terminated or suspended, any data that You may have stored on the
                Platform, may not be retrieved later. Open ASPM Project LLP shall be under no
                obligation to return the information or data to you. Open ASPM Project LLP and
                Your Data As part of the Services, the Platform allows You to upload data / content
                to it. All user data uploaded or submitted by You to Your Account, shall be Your
                sole property. You retain all rights in the data uploaded by You to the Platform and
                shall remain liable for the legality, reliability, integrity, accuracy and copyright
                permissions thereto of such data. Open ASPM Project LLP will use commercially
                reasonable security measures to protect the Your data against unauthorized
                disclosure or use. However, Open ASPM Project LLP does not guarantee complete
                data security. If Your Data is damaged or lost, Open ASPM Project LLP will use
                commercially reasonable means to recover such data. You agree that You are entering
                into this agreement in full knowledge of the same. You grant your consent to NGFW
                Security Services LLP to disclose to its affiliates / partners / third parties Your
                Account Information to the extent necessary for the purpose of rendering the
                Services. Your Responsibilities Making all arrangements necessary for you to have
                access to the Platform. You are entirely responsible for ensuring that all persons
                who access the Platform through your internet connection are aware of this
                Agreement, the Privacy Policy and any other terms and policies pertaining to The
                Firewall Appsec Platform and comply with them. You are entirely responsible for the
                accuracy of Your Data. Confidentiality All “Confidential Information” i.e., all
                confidential information disclosed by you to Open ASPM Project LLP that is
                designated in writing as confidential as well as all Your Data, and Your Personal
                Information shall not be used or disclosed for any purpose outside the scope of this
                Agreement and Open ASPM Project LLP’s Privacy Policy, except when required by
                the process of law or with your prior written permission. Confidential Information
                shall not include information which: is known publicly; is generally known in the
                industry before disclosure; has become known publicly, without fault of the NGFW
                Security Services LLP, after disclosure by you; or has been otherwise lawfully known
                or received by Open ASPM Project LLP. Except as otherwise expressly permitted
                under this Services Agreement, Open ASPM Project LLP agrees to keep
                confidential all information entrusted to it by You and to protect it at all times
                by exercising a reasonable degree of care. Open ASPM Project LLP may disclose
                Information to its employees, consultants, agents or advisors who have a strict need
                to know such Confidential Information solely for the purpose of performing NGFW
                Security Services LLP’s obligations under this Agreement and only to those who are
                obligated to maintain the confidentiality of such Confidential Information upon
                terms at least as protective as those contained in this Agreement. You may disclose
                Open ASPM Project LLP’s Confidential Information to your employees,
                consultants, agents or advisors who have a strict need to know such Confidential
                Information and are obligated to maintain the confidentiality of such Confidential
                Information upon terms at least as protective as those contained in this Agreement.
                If in case Open ASPM Project LLP is required by law, or upon receiving process
                from a court of law, to disclose Confidential Information, it will be bound to
                disclose such information. You grant your consent to Open ASPM Project LLP to
                disclose to its affiliates / partners / third parties Your Account Information to
                the extent necessary for the purpose of rendering the Services. Data Privacy The
                treatment of Your Personal Information is governed by our Privacy Policy, which is
                incorporated by reference into this Master Subscription Agreement. Third Party
                Rights and Liabilities Open ASPM Project LLP cannot and does not take any
                responsibility for or make any warranty in respect of any third party softwares
                which are integrated into the Platform. To the extent the Platform is bundled with
                third party software programs; these third-party software programs are governed by
                their own terms, which may include open source or free software licenses. Nothing in
                this Agreement limits your rights under, or grants you rights that supersede the
                terms of any such third-party software. Intellectual Property Ownership and Rights
                “Intellectual Property” shall mean any current or future worldwide rights under any
                patent, copyright, trademark, or trade secret; any moral rights or any similar
                rights. All intellectual property rights relating to the Platform, its content,
                materials including, but not limited to text, data, information, graphics, logos,
                tools, photographs, images, illustrations, audio, video and animations are
                intellectual property owned by Open ASPM Project LLP and/or third parties and
                are protected by the laws of India and international copyright laws. All trademarks,
                service marks, and trade names are proprietary to Open ASPM Project LLP and/or
                third parties. Open ASPM Project LLP is protected by copyright pursuant to
                Indian copyright laws, international conventions, and other copyright laws. Except
                as explicitly permitted in this Agreement, You may not copy, modify, publish,
                transmit, upload, participate in the transfer or sale of, reproduce, create
                derivative works based on, distribute, or in any way exploit any of the Site
                content, software, materials relating to the Service in whole or in part You shall
                abide by all copyright notices, information, and restrictions contained in any
                content accessed through the Platform. All the rights of intellectual property to
                trademarks, trade names, Your data including but not limited to the information
                obtained through online forms, which contain additional information and all
                information in connection with and entered or generated by You by using the Platform
                are and will remain Your property. You hereby grant to Open ASPM Project LLP a
                limited, non- exclusive and non-transferable (except in connection with the sale or
                transfer of its business) license to access, use, copy, reproduce, process, adapt,
                publish, transmit and display Your Data for the limited purpose of (i) providing the
                Service and associated customer support to you; (ii) analyzing and improving the
                Service You agree that Open ASPM Project LLP may include your name in a list of
                Open ASPM Project LLP’s Customers online and in print and electronic marketing
                materials. Nothing in this Agreement gives You any right, title or interest in or to
                the Platform or any Open ASPM Project LLP Intellectual Property. Disclaimers
                THE PLATFORM AND THE SERVICES ARE PROVIDED ON AN “AS-IS” AND “WITH ALL FAULTS AND
                RISKS” BASIS, WITHOUT WARRANTIES OF ANY KIND. Open ASPM Project LLP DOES NOT
                WARRANT, EXPRESSLY OR BY IMPLICATION, THE ACCURACY OR RELIABILITY OF THE PLATFORM OR
                THE SERVICES OR ITS SUSTAINABILITY FOR A PARTICULAR PURPOSE OR THE SAFETY/SECURITY
                OF THE DATA/CONTENT STORED ON THE PLATFORM BY YOU. Open ASPM Project LLP
                DISCLAIMS ALL WARRANTIES WHETHER EXPRESS OR IMPLIED, INCLUDING THOSE OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE USE
                OF THE PLATFORM OR ANY MATERIAL THEREOF WILL BE UNINTERRUPTED OR ERROR-FREE. WITHOUT
                LIMITING THE GENERALITY OF THE FOREGOING, Open ASPM Project LLP DOES NOT
                REPRESENT OR WARRANT THAT THE PLATFORM AND THE SERVICES WILL RESULT IN COMPLIANCE,
                FULFILLMENT OR CONFORMITY WITH THE LAWS, REGULATIONS, REQUIREMENTS OR GUIDELINES OF
                ANY GOVERNMENT OR GOVERNMENTAL AGENCY. SPECIFICALLY, BUT WITHOUT LIMITATION, NGFW
                Security Services LLP DOES NOT WARRANT THAT: THE PLATFORM/SERVICES SHALL PROVIDE
                ALERTS, INTIMATIONS OF THREATS WITHIN A CERTAIN TIME PERIOD; THE INFORMATION
                INCLUDING ALERTS ETC. DISPLAYED/AVAILABLE ON THE PLATFORM IS ACCURATE FREE OF ERRORS
                THE FUNCTIONS OR FEATURES (INCLUDING BUT NOT LIMITED TO MECHANISMS FOR THE
                DOWNLOADING AND UPLOADING OF YOUR DATA) WILL BE UNINTERRUPTED, SECURE, OR FREE OF
                ERRORS ALL DEFECTS WILL BE CORRECTED, OR THE SERVICES OR THE SERVER(S) THAT MAKE THE
                SERVICES AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. The content on
                such as estimates, projections, charges on the Platform and Services is provided for
                general information only and is not intended to amount to advice on which you should
                rely. You must obtain professional advice before taking, or refraining from, any
                action on the basis of such content. No information or advice obtained by you from
                us or through the Services or Platform shall create any warranty not expressly
                stated in this Agreement. Open ASPM Project LLP does not promise that any
                predictions that feature on the Platform are 100% accurate. Any predictions
                regarding the same is entirely based on Artificial Intelligence functionalities and
                available data and Open ASPM Project LLP disclaims all liability with regard to
                the same. To the maximum extent permitted by applicable law, Open ASPM Project
                LLP provides no warranty on the use of the Platform and the Services and shall not
                be liable for the same under any laws applicable to intellectual property rights,
                libel, privacy, publicity, obscenity or other laws. Open ASPM Project LLP also
                disclaims all liability with respect to the misuse, loss, modification or
                unavailability of the Platform and the Services. Indemnification You shall indemnify
                and hold harmless, Open ASPM Project LLP, its affiliates, any third party
                content / networks / infrastructure providers and their respective directors,
                officers, personnel, contractors and agents (and all successors and assigns of the
                foregoing) for and against any and all claims, losses, damages, costs and expenses
                (including but not limited to attorney’s fees) arising out of, or relating to, Your
                use of the Platform and the Services or Your breach of this Agreement or any other
                restrictions or guidelines provided by Open ASPM Project LLP, your violation of
                the terms or Open ASPM Project LLP’s Privacy Policy, your violation of an
                applicable law, your submission, posting, or transmission of user content to the
                services, and/or your violation of any rights of another. We reserve the right, at
                our own expense, to assume the exclusive defense and control of such disputes, and
                in any event you will cooperate with us in asserting any available defenses. This
                indemnification obligation will survive at all times, including, Your use of the
                Platform and the Services. In no event will Open ASPM Project LLP have any
                obligations or liability under this section arising from: (i) use of the Service in
                a modified form or in combination with materials not furnished by OpenASPM
                Services LLP; or (ii) any content, information, or data provided by users, or other
                third parties. THIS INDEMNITY IS SUBSCRIBER’S ONLY REMEDY UNDER THIS AGREEMENT FOR
                ANY VIOLATION BY Open ASPM Project LLP OF ANY THIRD PARTY’S INTELLECTUAL
                PROPERTY RIGHTS. Limitation of Liability YOU EXPRESSLY UNDERSTAND AND AGREE THAT
                Open ASPM Project LLP AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS AND
                MEMBERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                PUNITIVE OR EXEMPLARY DAMAGES, HOWEVER, CAUSED INCLUDING BUT NOT LIMITED TO, DAMAGES
                FOR LOSS OF PROFITS, GOODWILL, OR OTHER INTANGIBLE LOSSES (EVEN IF OpenASPM
                Services LLP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES INCLUDING, WITHOUT
                LIMITATION, LOSS OF BUSINESS, LOST PROFITS OR REVENUE.), RESULTING FROM: THE USE OR
                THE INABILITY TO USE THE SERVICE FOR ANY REASON; USE OF SERVICES THROUGH THE
                PLATFORM THAT INVOLVE ARTIFICIAL INTELLIGENCE; ANY LOSSES CAUSED DUE TO DELAY IN
                PROVIDING ALERTS OR INTIMATIONS OF PROBABLE THREATS; RELIANCE BY YOU ON INFORMATION
                FEATURING ON THE PLATFORM THAT IS OBTAINED FROM PUBLIC SOURCES OR THIRD PARTIES; ANY
                SECURITY BREACH OR ANY VIRUS, BUG, UNAUTHORIZED INTERVENTION, DEFECT, OR TECHNICAL
                MALFUNCTIONING OF THE PLATFORM; THE COST OF PROCUREMENT OF SUBSTITUTE GOODS AND
                SERVICES RESULTING FROM ANY GOODS, DATA, INFORMATION OR SERVICES PURCHASED OR
                OBTAINED OR MESSAGES RECEIVED OR TRANSACTIONS ENTERED INTO THROUGH OR FROM THE
                SERVICE; STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE FOR ANY AMOUNTS
                THAT EXCEED THE FEES PAID BY YOU TO Open ASPM Project LLP UNDER THIS AGREEMENT
                DURING THE PERIOD PRIOR TO THE OCCURRENCE GIVING RISE TO YOUR CLAIM OR CAUSE OF
                ACTION AGAINST Open ASPM Project LLP. NEITHER DOES Open ASPM Project LLP
                ACCEPT RESPONSIBILITY NOR SHALL IT BE LIABLE FOR ANY LOSS/DAMAGES ARISING OUT OF
                INCIDENTS DURING PICKUP/DELIVERY OF GOODS. UNDER NO CIRCUMSTANCES WILL OpenASPM
                Services LLP BE RESPONSIBLE FOR ANY DAMAGE, LOSS OR INJURY RESULTING FROM HACKING,
                TAMPERING OR OTHER UNAUTHORIZED ACCESS OR USE OF THE SERVICE OR CUSTOMER’S ACCOUNT
                OR THE INFORMATION CONTAINED THEREIN BY ANY THIRD PARTY. THE LIMITATIONS OF
                LIABILITY HEREIN SHALL NOT APPLY TO ANY INDEMNIFICATION PROVIDED BY YOU OR NGFW
                Security Services LLP HEREUNDER. THE LIMITATIONS SPECIFIED IN THIS SECTION WILL
                SURVIVE TERMINATION OR EXPIRATION OF THIS AGREEMENT AND APPLY EVEN IF ANY LIMITED
                REMEDY SPECIFIED IN THIS AGREEMENT ARE FOUND TO HAVE FAILED OF ITS ESSENTIAL
                PURPOSE. THIS LIMITATION OF LIABILITY WILL NOT APPLY IN CASE OF GROSS NEGLIGENCE OR
                WILFUL MISCONDUCT. BECAUSE SOME JURISDICTIONS DO NOT ALLOW the LIMITATION OF
                LIABILITY IN CERTAIN INSTANCES, PORTIONS OF THE ABOVE RESTRICTION OUTLINED IN THIS
                SECTION MAY NOT APPLY TO YOU. NO ACTION AGAINST EITHER PARTY ARISING OUT OF THIS
                AGREEMENT MAY BE BROUGHT BY THE OTHER PARTY MORE THAN ONE MONTH AFTER THE CAUSE OF
                ACTION HAS ARISEN. THESE LIMITATIONS OF LIABILITY SHALL APPLY REGARDLESS OF WHETHER
                A PARTY KNEW OR SHOULD HAVE KNOWN THAT SUCH DAMAGES WERE POSSIBLE AND EVEN IF A
                REMEDY FAILS OF ITS ESSENTIAL PURPOSE. EXCEPT IN CONNECTION WITH ITS INDEMNIFICATION
                OBLIGATIONS HEREUNDER. NOTWITHSTANDING THE FOREGOING, IN NO EVENT SHALL NGFW
                Security Services LLP’S AGGREGATE LIABILITY (WHETHER IN CONTRACT, TORT OR
                OTHERWISE), AND THAT OF ITS AFFILIATES SHALL EXCEED AN AMOUNT THE AMOUNT PAID BY YOU
                TO Open ASPM Project LLP HEREUNDER PRIOR TO THE EVENT GIVING RISE TO LIABILITY
                AND TO THE AMOUNT, PROVIDED IN THIS CLAUSE, IS THE ONLY RECOURSE THAT YOU MAY HAVE
                AGAINST Open ASPM Project LLP FOR BREACH BY Open ASPM Project LLP OF ANY
                OF ITS RIGHTS OR OBLIGATIONS HEREUNDER. Force Majeure Open ASPM Project LLP
                shall not be required to comply with any obligation under this Agreement if such
                compliance is impeded by any event of force majeure. Events of force majeure shall
                mean an event which is beyond the control of the affected party and which such party
                could not anticipate or mitigate by means of insurance, contingency planning or any
                other prudent means, including in case of non-availability of any portion of the
                Platform and/or Services occasioned by act of God, war, disease, revolution, riot,
                civil commotion, strike, lockout, flood, fire, failure of any public utility,
                man-made disaster, infrastructure failure, technology outages, failure of technology
                integration of partners or any other cause whatsoever, beyond the control of NGFW
                Security Services LLP. Notwithstanding the preceding, if either party is affected by
                an event of force majeure it shall take all reasonable steps to minimize the impact
                of the force majeure event on the other party and to reduce the period of the effect
                of the force majeure event to the minimum. In case of a force majeure event, NGFW
                Security Services LLP shall not be liable for any breach of security or loss of data
                uploaded by You to the Platform. Governing Law and Dispute Resolution In the event
                of a dispute, difference or claim between the parties hereto, arising out of this
                Agreement or in any way relating hereto, or any term, condition or provision herein
                mentioned or the construction or interpretation thereof or otherwise in relation
                hereto, the parties shall first endeavour to settle such difference, dispute, claim
                or question by mutual discussion, failing which the same shall be referred to
                arbitration. Any unresolved disputes or claims which may arise out of or in
                connection with the Agreement shall be referred to arbitration before a single
                arbitrator mutually appointed by the Parties in accordance with the Arbitration and
                Conciliation Act, 1996 or any statutory modification or re-enactment thereof for the
                time being in force. Any award, whether interim or final, shall be made, and shall
                be deemed for all purposes between the parties to be made, in Bangalore. The
                arbitration proceedings shall be conducted in English language and shall be held in
                Nainital, India. This Agreement will be governed by the laws of India, and shall be
                subject to the exclusive jurisdiction of the courts of Nainital, Uttarakhand.
                Miscellaneous No Partnership. Nothing in this Agreement shall be deemed to
                constitute a joint venture, partnership or agent principal relationship between the
                Parties. Each Party is interacting with the other on a principal to principal basis
                and acts of one Party shall not bind the other Party save and except in terms of
                this Agreement. Severability. If any of the provisions of this Agreement are deemed
                invalid, void, or for any reason unenforceable, that part of the Agreement will be
                deemed severable and will not affect the validity and enforceability of any
                remaining provisions of this Agreement. Waiver. Any failure by OpenASPM
                Services LLP to enforce the Agreement, for whatever reason, shall not necessarily be
                construed as a waiver of any right to do so at any time. Entire Agreement. The
                Agreement as amended from time to time, along with the Privacy Policy and other
                related policies made available from time to time, constitutes the entire agreement
                and supersedes all prior understandings between the parties relating to the subject
                matter herein. No other agreements, representations or warranties have been made to
                you with respect to the subject matter of this Agreement, except as referenced
                herein. Notices and Communication You agree to receive electronically all
                communications, agreements, documents, notices, and disclosures that we provide in
                connection with the Service and this Agreement (“Communications”). We may provide
                Communications in a variety of ways, including by e-mail, text, in-app
                notifications, or by posting them on the Open ASPM Project LLP website or
                through the Platform. You agree that all Communications that we provide to you
                electronically satisfy any legal requirement that such communications be in writing.
                Modifications Open ASPM Project LLP may amend or modify this Agreement from
                time to time in its sole and reasonable discretion. We will post any such changes on
                our website at least fifteen days prior to the date on which such modifications will
                become effective provided that no such amendments/modifications shall include a
                reduction is Your rights. By continuing to access or use the Platform after the
                posted effective date of modifications to this Agreement that do not include a
                reduction in your rights or our obligations hereunder, you agree to be bound by such
                modifications. If You have questions or concerns about this Agreement, please
                contact Open ASPM Project LLP at point of contact at Open ASPM Project LLP
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="mt-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
              className="data-[state=checked]:bg-primary"
            />
            <Label
              htmlFor="accept-terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the End User License Agreement
            </Label>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!accepted || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EulaDialog);
